/**
 * Controlador n8n para gestión de Recuperación de conversaciones
 *
 * FLUJO:
 * - Workflow 1 (marcar-visto-masivo): Crea/actualiza tipo_recuperacion según horas, mensaje_enviado = false
 * - Workflow 2 (candidatos-recuperacion): Obtiene registros donde mensaje_enviado = false
 * - Workflow 2 (registrar-envio): Envía mensaje y marca mensaje_enviado = true
 *
 * LÓGICA DE ENVÍO:
 * - < 24h (1h, 8h): Envío DIRECTO de texto via WhatsApp (ventana de 24h de Meta)
 * - >= 24h (24h, 48h, 72h): Plantillas de WhatsApp (requiere plantilla aprobada por Meta)
 *
 * Endpoints:
 * - GET /n8n/recuperacion/chats-sin-respuesta - Obtener chats donde el BOT envió el último mensaje
 * - POST /n8n/recuperacion/marcar-visto-masivo - Marcar/actualizar tipo_recuperacion (Workflow 1)
 * - GET /n8n/recuperacion/candidatos-recuperacion - Obtener pendientes de envío (Workflow 2)
 * - POST /n8n/recuperacion/registrar-envio - Enviar mensaje/plantilla y marcar como enviado (Workflow 2)
 */

const { sequelize, MensajeVisto, Mensaje } = require('../models/sequelize');
const { QueryTypes } = require('sequelize');
const whatsappGraphService = require('../services/whatsapp/whatsappGraph.service');
const logger = require('../config/logger/loggerClient');

// Secuencia de tipos de recuperación
const SECUENCIA_TIPOS = ['1h', '8h', '24h', '48h', '72h'];

// Tipos que usan envío directo (dentro de ventana de 24h de Meta)
const TIPOS_ENVIO_DIRECTO = ['1h', '8h'];

// Mensajes por defecto para envío directo. Variable soportada: {nombre} (nombre del prospecto)
const MENSAJES_RECUPERACION_DIRECTO = {
  '1h': 'Hola {nombre}, Quería saber si llegaste a ver el mensaje anterior. Cuando tengas un momento, seguimos conversando por aqui 💚',
  '8h': 'Hola {nombre}, 👋 Te escribo solo para quedarme atenta. Si más adelante quieres continuar viendo opciones de depas, me avisas 😊'
};

// Función para determinar tipo_recuperacion según horas
const getTipoRecuperacion = (horas) => {
  if (horas < 8) return '1h';
  if (horas < 24) return '8h';
  if (horas < 48) return '24h';
  if (horas < 72) return '48h';
  return '72h';
};

class N8nRecuperacionController {

  /**
   * GET /n8n/recuperacion/chats-sin-respuesta
   *
   * Obtiene chats donde el último mensaje es del BOT y el cliente no ha respondido.
   *
   * Query params:
   * - horas_min: Mínimo de horas sin respuesta (default 1)
   * - horas_max: Máximo de horas sin respuesta (opcional)
   * - id_empresa: Filtrar por empresa (opcional)
   * - limit: Límite de resultados (default 100)
   */
  async getChatsSinRespuesta(req, res) {
    try {
      const { horas_min = 1, horas_max, id_empresa, limit = 100 } = req.query;

      const horasMinNum = parseFloat(horas_min);
      const horasMaxNum = horas_max ? parseFloat(horas_max) : null;
      const limitNum = parseInt(limit);

      if (isNaN(horasMinNum) || horasMinNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro horas_min debe ser un número mayor o igual a 0'
        });
      }

      let query = `
        WITH ultimo_mensaje_por_chat AS (
          SELECT DISTINCT ON (m.id_chat)
            m.id as id_mensaje,
            m.id_chat,
            m.direccion,
            m.contenido,
            m.fecha_hora,
            c.id_prospecto,
            p.id_empresa,
            p.celular,
            p.nombre_completo,
            EXTRACT(EPOCH FROM (NOW() - m.fecha_hora)) / 3600 as horas_transcurridas
          FROM mensaje m
          INNER JOIN chat c ON c.id = m.id_chat
          INNER JOIN prospecto p ON p.id = c.id_prospecto
          WHERE m.estado_registro = 1
            AND c.estado_registro = 1
            AND p.estado_registro = 1
          ORDER BY m.id_chat, m.fecha_hora DESC
        )
        SELECT
          um.id_chat,
          um.id_mensaje as id_ultimo_mensaje,
          um.id_prospecto,
          um.id_empresa,
          um.celular,
          um.nombre_completo,
          um.direccion as direccion_ultimo_mensaje,
          um.contenido as contenido_ultimo_mensaje,
          um.fecha_hora as fecha_ultimo_mensaje,
          ROUND(um.horas_transcurridas::numeric, 2) as horas_sin_respuesta
        FROM ultimo_mensaje_por_chat um
        WHERE um.direccion = 'out'
          AND um.horas_transcurridas >= :horas_min
      `;

      const replacements = { horas_min: horasMinNum };

      if (horasMaxNum) {
        query += ` AND um.horas_transcurridas < :horas_max`;
        replacements.horas_max = horasMaxNum;
      }

      if (id_empresa) {
        query += ` AND um.id_empresa = :id_empresa`;
        replacements.id_empresa = parseInt(id_empresa);
      }

      query += ` ORDER BY um.horas_transcurridas DESC LIMIT :limit`;
      replacements.limit = limitNum;

      const chats = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      logger.info(`[n8nRecuperacion] getChatsSinRespuesta: ${chats.length} chats encontrados`);

      return res.json({
        success: true,
        total: chats.length,
        filtros: {
          horas_min: horasMinNum,
          horas_max: horasMaxNum || null,
          id_empresa: id_empresa ? parseInt(id_empresa) : null
        },
        chats
      });

    } catch (error) {
      logger.error(`[n8nRecuperacion] Error getChatsSinRespuesta: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /n8n/recuperacion/marcar-visto-masivo
   *
   * WORKFLOW 1: Crea o actualiza registros de mensaje_visto según las horas transcurridas.
   *
   * Lógica:
   * - Si no existe registro → CREAR con tipo correspondiente y mensaje_enviado = false
   * - Si existe pero tipo es menor → ACTUALIZAR tipo y mensaje_enviado = false
   *
   * Tipos según horas:
   * - 1-8h → '1h', 8-24h → '8h', 24-48h → '24h', 48-72h → '48h', 72+h → '72h'
   *
   * Body:
   * - horas_min: Mínimo de horas (default 1)
   * - horas_max: Máximo de horas (default 72)
   * - id_empresa: Filtrar por empresa (opcional)
   * - limit: Límite por lote (default 200, max 500)
   */
  async marcarVistoMasivo(req, res) {
    try {
      const { horas_min = 1, horas_max = 72, id_empresa, limit = 200 } = req.body;
      const horasMinNum = parseFloat(horas_min);
      const horasMaxNum = Math.min(parseFloat(horas_max) || 72, 72);
      const limitNum = Math.min(parseInt(limit) || 200, 500);

      if (isNaN(horasMinNum) || horasMinNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro horas_min debe ser un número mayor o igual a 0'
        });
      }

      if (horasMinNum >= horasMaxNum) {
        return res.status(400).json({
          success: false,
          error: 'horas_min debe ser menor que horas_max'
        });
      }

      // Query para obtener chats con su estado actual de recuperación
      let query = `
        WITH ultimo_mensaje_por_chat AS (
          SELECT DISTINCT ON (m.id_chat)
            m.id as id_mensaje,
            m.id_chat,
            m.direccion,
            m.fecha_hora,
            p.id_empresa,
            EXTRACT(EPOCH FROM (NOW() - m.fecha_hora)) / 3600 as horas_transcurridas
          FROM mensaje m
          INNER JOIN chat c ON c.id = m.id_chat
          INNER JOIN prospecto p ON p.id = c.id_prospecto
          inner join estado_prospecto ep on ep.id = p.id_estado_prospecto
          WHERE m.estado_registro = 1
            AND c.estado_registro = 1
            AND p.estado_registro = 1
            and ep.id <> 4
          ORDER BY m.id_chat, m.fecha_hora DESC
        ),
        visto_actual AS (
          SELECT DISTINCT ON (m.id_chat)
            m.id_chat,
            mv.id as id_mensaje_visto,
            mv.tipo_recuperacion as tipo_actual,
            mv.mensaje_enviado
          FROM mensaje_visto mv
          INNER JOIN mensaje m ON m.id = mv.id_mensaje
          WHERE mv.estado_registro = 1
          ORDER BY m.id_chat, mv.fecha_visto DESC
        )
        SELECT
          um.id_mensaje,
          um.id_chat,
          ROUND(um.horas_transcurridas::numeric, 2) as horas,
          va.id_mensaje_visto,
          va.tipo_actual,
          va.mensaje_enviado
        FROM ultimo_mensaje_por_chat um
        LEFT JOIN visto_actual va ON va.id_chat = um.id_chat
        WHERE um.direccion = 'out'
          AND um.horas_transcurridas >= :horas_min
          AND um.horas_transcurridas < :horas_max
      `;

      const replacements = {
        horas_min: horasMinNum,
        horas_max: horasMaxNum
      };

      if (id_empresa) {
        query += ` AND um.id_empresa = :id_empresa`;
        replacements.id_empresa = parseInt(id_empresa);
      }

      query += ` ORDER BY um.horas_transcurridas ASC LIMIT :limit`;
      replacements.limit = limitNum;

      const mensajes = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Separar en: crear nuevos vs actualizar existentes
      const paraCrear = [];
      const paraActualizar = [];

      mensajes.forEach(m => {
        const tipoCorrespondiente = getTipoRecuperacion(m.horas);
        const indiceTipoCorrespondiente = SECUENCIA_TIPOS.indexOf(tipoCorrespondiente);
        const indiceTipoActual = m.tipo_actual ? SECUENCIA_TIPOS.indexOf(m.tipo_actual) : -1;

        // Solo procesar si el tipo correspondiente es mayor al actual
        if (indiceTipoCorrespondiente > indiceTipoActual) {
          if (m.id_mensaje_visto) {
            // Ya existe registro, actualizar tipo y resetear mensaje_enviado
            paraActualizar.push({
              id_mensaje_visto: m.id_mensaje_visto,
              tipo_nuevo: tipoCorrespondiente,
              tipo_anterior: m.tipo_actual
            });
          } else {
            // No existe, crear nuevo
            paraCrear.push({
              id_mensaje: m.id_mensaje,
              tipo_recuperacion: tipoCorrespondiente
            });
          }
        }
      });

      if (paraCrear.length === 0 && paraActualizar.length === 0) {
        return res.json({
          success: true,
          mensaje: 'No hay mensajes pendientes de procesar',
          count: 0,
          creados: 0,
          actualizados: 0,
          rango_horas: { min: horasMinNum, max: horasMaxNum }
        });
      }

      // Ejecutar en transacción
      const resultado = await sequelize.transaction(async (t) => {
        let creados = 0;
        let actualizados = 0;

        // Crear nuevos registros con mensaje_enviado = false
        if (paraCrear.length > 0) {
          const registros = paraCrear.map(m => ({
            id_mensaje: m.id_mensaje,
            fecha_visto: new Date(),
            tipo_recuperacion: m.tipo_recuperacion,
            mensaje_enviado: false,
            usuario_registro: null,
            estado_registro: 1
          }));

          await MensajeVisto.bulkCreate(registros, { transaction: t });
          creados = registros.length;
        }

        // Actualizar existentes agrupados por tipo (máx 5 queries en vez de N)
        if (paraActualizar.length > 0) {
          const gruposPorTipo = {};
          paraActualizar.forEach(item => {
            if (!gruposPorTipo[item.tipo_nuevo]) gruposPorTipo[item.tipo_nuevo] = [];
            gruposPorTipo[item.tipo_nuevo].push(item.id_mensaje_visto);
          });

          for (const [tipo, ids] of Object.entries(gruposPorTipo)) {
            await sequelize.query(`
              UPDATE mensaje_visto
              SET tipo_recuperacion = :tipo_nuevo,
                  mensaje_enviado = false,
                  fecha_actualizacion = NOW(),
                  usuario_actualizacion = NULL
              WHERE id IN (:ids)
            `, {
              replacements: { tipo_nuevo: tipo, ids },
              transaction: t
            });
          }
          actualizados = paraActualizar.length;
        }

        return { creados, actualizados };
      });

      // Resumen
      const resumenCreados = {};
      const resumenActualizados = {};
      paraCrear.forEach(m => {
        resumenCreados[m.tipo_recuperacion] = (resumenCreados[m.tipo_recuperacion] || 0) + 1;
      });
      paraActualizar.forEach(m => {
        const key = `${m.tipo_anterior || 'null'}->${m.tipo_nuevo}`;
        resumenActualizados[key] = (resumenActualizados[key] || 0) + 1;
      });

      logger.info(`[n8nRecuperacion] marcarVistoMasivo: creados=${resultado.creados}, actualizados=${resultado.actualizados}`);

      return res.json({
        success: true,
        mensaje: 'Mensajes procesados exitosamente',
        count: resultado.creados + resultado.actualizados,
        creados: resultado.creados,
        actualizados: resultado.actualizados,
        rango_horas: { min: horasMinNum, max: horasMaxNum },
        resumen: {
          creados_por_tipo: resumenCreados,
          actualizados: resumenActualizados
        }
      });

    } catch (error) {
      logger.error(`[n8nRecuperacion] Error marcarVistoMasivo: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/recuperacion/candidatos-recuperacion
   *
   * WORKFLOW 2: Obtiene registros pendientes de envío de plantilla AGRUPADOS POR EMPRESA.
   *
   * Condiciones:
   * - mensaje_enviado = false
   * - tipo_recuperacion IS NOT NULL
   * - El chat tiene celular válido
   *
   * Query params:
   * - tipo_recuperacion: Filtrar por tipo específico (opcional)
   * - id_empresa: Filtrar por empresa específica (opcional)
   * - limit: Límite de resultados por empresa (default 100)
   */
  async getCandidatosRecuperacion(req, res) {
    try {
      const { tipo_recuperacion, id_empresa, limit = 100 } = req.query;
      const limitNum = parseInt(limit);

      // Validar tipo_recuperacion si se proporciona
      if (tipo_recuperacion && !SECUENCIA_TIPOS.includes(tipo_recuperacion)) {
        return res.status(400).json({
          success: false,
          error: `tipo_recuperacion debe ser uno de: ${SECUENCIA_TIPOS.join(', ')}`
        });
      }

      // Query para obtener candidatos pendientes de envío
      let query = `
        SELECT
          mv.id as id_mensaje_visto,
          mv.tipo_recuperacion,
          mv.fecha_visto,
          m.id_chat,
          m.id as id_mensaje,
          m.contenido as contenido_ultimo_mensaje,
          m.fecha_hora as fecha_ultimo_mensaje,
          c.id_prospecto,
          p.id_empresa,
          e.nombre_comercial as nombre_empresa,
          p.celular,
          p.nombre_completo,
          ROUND((EXTRACT(EPOCH FROM (NOW() - m.fecha_hora)) / 3600)::numeric, 2) as horas_sin_respuesta
        FROM mensaje_visto mv
        INNER JOIN mensaje m ON m.id = mv.id_mensaje
        INNER JOIN chat c ON c.id = m.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto
        INNER JOIN empresa e ON e.id = p.id_empresa
        WHERE mv.estado_registro = 1
          AND mv.mensaje_enviado = false
          AND mv.tipo_recuperacion IS NOT NULL
          AND p.celular IS NOT NULL
          AND p.celular != ''
          AND p.estado_registro = 1
          AND c.estado_registro = 1
          AND e.estado_registro = 1
      `;

      const replacements = {};

      if (tipo_recuperacion) {
        query += ` AND mv.tipo_recuperacion = :tipo_recuperacion`;
        replacements.tipo_recuperacion = tipo_recuperacion;
      }

      if (id_empresa) {
        query += ` AND p.id_empresa = :id_empresa`;
        replacements.id_empresa = parseInt(id_empresa);
      }

      query += ` ORDER BY p.id_empresa ASC, mv.fecha_visto ASC`;

      const candidatosRaw = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Agrupar por empresa
      const empresasMap = new Map();

      candidatosRaw.forEach(candidato => {
        const empresaId = candidato.id_empresa;

        if (!empresasMap.has(empresaId)) {
          empresasMap.set(empresaId, {
            id_empresa: empresaId,
            nombre_empresa: candidato.nombre_empresa,
            total_pendientes: 0,
            candidatos: []
          });
        }

        const empresa = empresasMap.get(empresaId);

        // Aplicar límite por empresa
        if (empresa.candidatos.length < limitNum) {
          const metodoEnvio = TIPOS_ENVIO_DIRECTO.includes(candidato.tipo_recuperacion) ? 'directo' : 'plantilla';
          empresa.candidatos.push({
            id_mensaje_visto: candidato.id_mensaje_visto,
            tipo_recuperacion: candidato.tipo_recuperacion,
            metodo_envio: metodoEnvio,
            fecha_visto: candidato.fecha_visto,
            id_chat: candidato.id_chat,
            id_mensaje: candidato.id_mensaje,
            id_prospecto: candidato.id_prospecto,
            celular: candidato.celular,
            nombre_completo: candidato.nombre_completo,
            contenido_ultimo_mensaje: candidato.contenido_ultimo_mensaje,
            fecha_ultimo_mensaje: candidato.fecha_ultimo_mensaje,
            horas_sin_respuesta: candidato.horas_sin_respuesta
          });
        }

        empresa.total_pendientes++;
      });

      // Convertir a array
      const empresas = Array.from(empresasMap.values());

      // Calcular totales
      const totalEmpresas = empresas.length;
      const totalPendientes = empresas.reduce((sum, e) => sum + e.total_pendientes, 0);
      const totalEnRespuesta = empresas.reduce((sum, e) => sum + e.candidatos.length, 0);

      logger.info(`[n8nRecuperacion] getCandidatosRecuperacion: ${totalPendientes} pendientes en ${totalEmpresas} empresas`);

      return res.json({
        success: true,
        total_empresas: totalEmpresas,
        total_pendientes: totalPendientes,
        total_en_respuesta: totalEnRespuesta,
        filtros: {
          tipo_recuperacion: tipo_recuperacion || 'todos',
          id_empresa: id_empresa ? parseInt(id_empresa) : null,
          limit_por_empresa: limitNum
        },
        secuencia_tipos: SECUENCIA_TIPOS,
        empresas
      });

    } catch (error) {
      logger.error(`[n8nRecuperacion] Error getCandidatosRecuperacion: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /n8n/recuperacion/registrar-envio
   *
   * WORKFLOW 2: Envía mensaje de recuperación y marca como enviado.
   * Este endpoint maneja TODO el envío (directo y plantilla) — n8n solo necesita llamar aquí.
   *
   * Lógica de envío:
   * - < 24h (1h, 8h): Envío DIRECTO de texto aprovechando ventana de 24h de Meta
   *   - Si falla (ventana cerrada), hace fallback automático a plantilla
   * - >= 24h (24h, 48h, 72h): Envío de PLANTILLA via WhatsApp Cloud API
   *
   * Todas las plantillas usan {nombre} como variable (nombre del prospecto).
   *
   * Plantillas:
   * - 1h  → recuperacion_1h  (fallback)
   * - 8h  → recuperacion_8h  (fallback)
   * - 24h → recuperacion_24h
   * - 48h → recuperacion_48h
   * - 72h → recuperacion_72h
   *
   * Body:
   * - id_mensaje_visto: ID del registro en mensaje_visto (REQUERIDO)
   * - mensaje_personalizado: Mensaje custom para envío directo (opcional, sobreescribe el default)
   */
  async registrarEnvio(req, res) {
    try {
      const { id_mensaje_visto, mensaje_personalizado } = req.body;

      if (!id_mensaje_visto) {
        return res.status(400).json({
          success: false,
          error: 'id_mensaje_visto es requerido'
        });
      }

      // Mapeo de tipo_recuperacion a nombre de plantilla (para todos los tipos)
      const PLANTILLAS_RECUPERACION = {
        '1h': 'recuperacion_1h',
        '8h': 'recuperacion_8h',
        '24h': 'recuperacion_24h',
        '48h': 'recuperacion_48h',
        '72h': 'recuperacion_72h'
      };

      // Verificar que existe el registro y obtener datos del prospecto
      const [registro] = await sequelize.query(`
        SELECT
          mv.id,
          mv.tipo_recuperacion,
          mv.mensaje_enviado,
          m.id_chat,
          p.id_empresa,
          p.celular,
          p.nombre_completo
        FROM mensaje_visto mv
        INNER JOIN mensaje m ON m.id = mv.id_mensaje
        INNER JOIN chat c ON c.id = m.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto
        WHERE mv.id = :id_mensaje_visto
          AND mv.estado_registro = 1
      `, {
        replacements: { id_mensaje_visto: parseInt(id_mensaje_visto) },
        type: QueryTypes.SELECT
      });

      if (!registro) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró el registro de mensaje_visto'
        });
      }

      if (registro.mensaje_enviado) {
        return res.status(409).json({
          success: false,
          error: 'Este registro ya fue marcado como enviado',
          data: {
            id_mensaje_visto: registro.id,
            tipo_recuperacion: registro.tipo_recuperacion
          }
        });
      }

      const nombreProspecto = registro.nombre_completo || 'estimado/a';
      const nombrePlantilla = PLANTILLAS_RECUPERACION[registro.tipo_recuperacion];

      if (!nombrePlantilla) {
        return res.status(400).json({
          success: false,
          error: `tipo_recuperacion inválido: ${registro.tipo_recuperacion}`
        });
      }

      const esEnvioDirecto = TIPOS_ENVIO_DIRECTO.includes(registro.tipo_recuperacion);
      let resultadoEnvio = {};

      if (esEnvioDirecto) {
        // === ENVÍO DIRECTO (< 24h) - Ventana de Meta ===
        const mensajeBase = mensaje_personalizado || MENSAJES_RECUPERACION_DIRECTO[registro.tipo_recuperacion];
        const mensajeFinal = mensajeBase.replace(/\{nombre\}/g, nombreProspecto);

        try {
          const whatsappResult = await whatsappGraphService.enviarMensajeTexto(
            registro.id_empresa,
            registro.celular,
            mensajeFinal
          );

          // Registrar mensaje saliente en BD
          const mensajeDB = await Mensaje.create({
            id_chat: registro.id_chat,
            direccion: 'out',
            tipo_mensaje: 'texto',
            contenido: mensajeFinal,
            wid_mensaje: whatsappResult.wid_mensaje || null,
            contenido_archivo: null,
            id_usuario: null,
            id_plantilla_whatsapp: null,
            fecha_hora: new Date(),
            usuario_registro: null,
            estado_registro: 1
          });

          resultadoEnvio = {
            metodo_envio: 'directo',
            mensaje_enviado_texto: mensajeFinal,
            wid_mensaje: whatsappResult.wid_mensaje,
            id_mensaje_registrado: mensajeDB.id
          };

          logger.info(`[n8nRecuperacion] registrarEnvio: Recuperación ${registro.tipo_recuperacion} DIRECTO para chat ${registro.id_chat}, wid: ${whatsappResult.wid_mensaje}`);

        } catch (directoError) {
          // Fallback a plantilla si el envío directo falla (ventana cerrada, etc.)
          logger.warn(`[n8nRecuperacion] Envío directo falló para chat ${registro.id_chat}: ${directoError.message}. Intentando fallback con plantilla ${nombrePlantilla}...`);

          resultadoEnvio = await this._enviarPlantillaRecuperacion(
            registro, nombrePlantilla, nombreProspecto
          );
          resultadoEnvio.fallback = true;
          resultadoEnvio.error_directo = directoError.message;
        }

      } else {
        // === PLANTILLA (>= 24h) - Fuera de ventana de Meta ===
        resultadoEnvio = await this._enviarPlantillaRecuperacion(
          registro, nombrePlantilla, nombreProspecto
        );
      }

      // Actualizar mensaje_enviado = true
      await sequelize.query(`
        UPDATE mensaje_visto
        SET mensaje_enviado = true,
            fecha_actualizacion = NOW(),
            usuario_actualizacion = NULL
        WHERE id = :id_mensaje_visto
      `, {
        replacements: { id_mensaje_visto: parseInt(id_mensaje_visto) }
      });

      return res.json({
        success: true,
        mensaje: 'Envío registrado exitosamente',
        data: {
          id_mensaje_visto: parseInt(id_mensaje_visto),
          id_chat: registro.id_chat,
          tipo_recuperacion: registro.tipo_recuperacion,
          id_empresa: registro.id_empresa,
          celular: registro.celular,
          nombre_completo: registro.nombre_completo,
          ...resultadoEnvio
        }
      });

    } catch (error) {
      logger.error(`[n8nRecuperacion] Error registrarEnvio: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Método interno: envía una plantilla de recuperación via WhatsApp y registra en BD.
   * Todas las plantillas usan {nombre} como variable body {{1}}.
   */
  async _enviarPlantillaRecuperacion(registro, nombrePlantilla, nombreProspecto) {
    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: nombreProspecto }
        ]
      }
    ];

    const whatsappResult = await whatsappGraphService.enviarPlantilla(
      registro.id_empresa,
      registro.celular,
      nombrePlantilla,
      'es',
      components
    );

    const wid_mensaje = whatsappResult?.wid_mensaje || whatsappResult?.response?.messages?.[0]?.id || null;

    // Registrar mensaje saliente en BD
    const mensajeDB = await Mensaje.create({
      id_chat: registro.id_chat,
      direccion: 'out',
      tipo_mensaje: 'plantilla',
      contenido: `[Plantilla: ${nombrePlantilla}]`,
      wid_mensaje,
      contenido_archivo: null,
      id_usuario: null,
      id_plantilla_whatsapp: null,
      fecha_hora: new Date(),
      usuario_registro: null,
      estado_registro: 1
    });

    logger.info(`[n8nRecuperacion] Plantilla ${nombrePlantilla} enviada para chat ${registro.id_chat}, wid: ${wid_mensaje}`);

    return {
      metodo_envio: 'plantilla',
      nombre_plantilla: nombrePlantilla,
      wid_mensaje,
      id_mensaje_registrado: mensajeDB.id
    };
  }

  // ============================================
  // ENDPOINTS LEGACY (mantener compatibilidad)
  // ============================================

  /** @deprecated Usar getChatsSinRespuesta */
  async getChatsPendientes(req, res) {
    return this.getChatsSinRespuesta(req, res);
  }

  /** @deprecated Usar marcarVistoMasivo */
  async marcarVisto(req, res) {
    return this.marcarVistoMasivo(req, res);
  }
}

module.exports = new N8nRecuperacionController();
