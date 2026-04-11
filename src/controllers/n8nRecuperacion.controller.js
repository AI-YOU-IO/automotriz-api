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

/**
 * Carga la secuencia de periodicidades desde la BD ordenadas por cada_horas ASC.
 * Retorna { secuencia: ['24h','48h',...], getTipo(horas), horasMin, horasMax }
 */
async function cargarPeriodicidades(idEmpresa) {
  const rows = await sequelize.query(`
    SELECT DISTINCT cada_horas
    FROM periodicidad_recordatorio
    WHERE estado_registro = 1
      ${idEmpresa ? 'AND id_empresa = :idEmpresa' : ''}
    ORDER BY cada_horas ASC
  `, {
    replacements: idEmpresa ? { idEmpresa } : {},
    type: QueryTypes.SELECT
  });

  const horas = rows.map(r => r.cada_horas);
  const secuencia = horas.map(h => `${h}h`);

  const getTipo = (horasTranscurridas) => {
    for (let i = horas.length - 1; i >= 0; i--) {
      if (horasTranscurridas >= horas[i]) return `${horas[i]}h`;
    }
    return null;
  };

  const horasMin = horas.length > 0 ? horas[0] : 24;
  const horasMax = horas.length > 0 ? horas[horas.length - 1] * 3 : 168;

  return { secuencia, getTipo, horasMin, horasMax };
}

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
      const { horas_min = 24, horas_max, id_empresa, limit = 100 } = req.query;

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
   * Los tipos y rangos se obtienen dinámicamente de la tabla periodicidad_recordatorio.
   *
   * Body:
   * - id_empresa: Filtrar por empresa (opcional)
   * - limit: Límite por lote (default 200, max 500)
   */
  async marcarVistoMasivo(req, res) {
    try {
      const { id_empresa, limit = 200 } = req.body;
      const limitNum = Math.min(parseInt(limit) || 200, 500);

      // Cargar periodicidades dinámicamente desde BD
      const { secuencia, getTipo, horasMin, horasMax } = await cargarPeriodicidades(id_empresa || null);

      if (secuencia.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay periodicidades configuradas en la base de datos'
        });
      }

      logger.info(`[n8nRecuperacion] marcarVistoMasivo: secuencia=${secuencia.join(',')}, rango=${horasMin}h-${horasMax}h`);

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
          INNER JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
          WHERE m.estado_registro = 1
            AND c.estado_registro = 1
            AND p.estado_registro = 1
            AND ep.id <> 4
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
          um.fecha_hora,
          ROUND(um.horas_transcurridas::numeric, 2) as horas,
          va.id_mensaje_visto,
          va.tipo_actual,
          va.mensaje_enviado
        FROM ultimo_mensaje_por_chat um
        LEFT JOIN visto_actual va ON va.id_chat = um.id_chat
        WHERE um.direccion = 'out'
          AND um.horas_transcurridas >= :horas_min
      `;

      const replacements = { horas_min: horasMin };

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
        const tipoCorrespondiente = getTipo(m.horas);
        if (!tipoCorrespondiente) return;

        const indiceTipoCorrespondiente = secuencia.indexOf(tipoCorrespondiente);
        const indiceTipoActual = m.tipo_actual ? secuencia.indexOf(m.tipo_actual) : -1;

        if (indiceTipoCorrespondiente > indiceTipoActual) {
          if (m.id_mensaje_visto) {
            paraActualizar.push({
              id_mensaje_visto: m.id_mensaje_visto,
              tipo_nuevo: tipoCorrespondiente,
              tipo_anterior: m.tipo_actual
            });
          } else {
            paraCrear.push({
              id_mensaje: m.id_mensaje,
              tipo_recuperacion: tipoCorrespondiente,
              fecha_hora_mensaje: m.fecha_hora
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
          secuencia
        });
      }

      const resultado = await sequelize.transaction(async (t) => {
        let creados = 0;
        let actualizados = 0;

        if (paraCrear.length > 0) {
          const registros = paraCrear.map(m => ({
            id_mensaje: m.id_mensaje,
            fecha_visto: new Date(new Date(m.fecha_hora_mensaje).toLocaleString('en-US', { timeZone: 'America/Lima' })),
            tipo_recuperacion: m.tipo_recuperacion,
            mensaje_enviado: false,
            usuario_registro: null,
            estado_registro: 1
          }));
          await MensajeVisto.bulkCreate(registros, { transaction: t });
          creados = registros.length;
        }

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

      const resumenCreados = {};
      const resumenActualizados = {};
      paraCrear.forEach(m => {
        resumenCreados[m.tipo_recuperacion] = (resumenCreados[m.tipo_recuperacion] || 0) + 1;
      });
      paraActualizar.forEach(m => {
        const key = `${m.tipo_anterior || 'null'}->${m.tipo_nuevo}`;
        resumenActualizados[key] = (resumenActualizados[key] || 0) + 1;
      });

      logger.info(`[n8nRecuperacion] marcarVistoMasivo: creados=${resultado.creados}, actualizados=${resultado.actualizados}, secuencia=${secuencia.join(',')}`);

      return res.json({
        success: true,
        mensaje: 'Mensajes procesados exitosamente',
        count: resultado.creados + resultado.actualizados,
        creados: resultado.creados,
        actualizados: resultado.actualizados,
        secuencia,
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
          const metodoEnvio = 'plantilla';
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

      // Obtener registro con datos del prospecto, chat y marca
      const [registro] = await sequelize.query(`
        SELECT
          mv.id,
          mv.tipo_recuperacion,
          mv.mensaje_enviado,
          m.id_chat,
          p.id_empresa,
          p.celular,
          p.nombre_completo,
          p.correo,
          p.tipo_documento,
          p.numero_documento,
          c.id_marca,
          c.id_modelo,
          c.id_version,
          ma.nombre AS nombre_marca,
          ma.descripcion AS descripcion_marca,
          mo.nombre AS nombre_modelo,
          mo.descripcion AS descripcion_modelo
        FROM mensaje_visto mv
        INNER JOIN mensaje m ON m.id = mv.id_mensaje
        INNER JOIN chat c ON c.id = m.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto
        LEFT JOIN marca ma ON ma.id = c.id_marca
        LEFT JOIN modelo mo ON mo.id = c.id_modelo
        WHERE mv.id = :id_mensaje_visto
          AND mv.estado_registro = 1
      `, {
        replacements: { id_mensaje_visto: parseInt(id_mensaje_visto) },
        type: QueryTypes.SELECT
      });

      if (!registro) {
        return res.status(404).json({ success: false, error: 'No se encontró el registro de mensaje_visto' });
      }

      if (registro.mensaje_enviado) {
        return res.status(409).json({
          success: false,
          error: 'Este registro ya fue marcado como enviado',
          data: { id_mensaje_visto: registro.id, tipo_recuperacion: registro.tipo_recuperacion }
        });
      }

      // Buscar la periodicidad que matchea tipo_recuperacion + marca del chat
      const horas = parseInt(registro.tipo_recuperacion);
      const [periodicidad] = await sequelize.query(`
        SELECT pr.id, pr.id_plantilla, pr.id_marca, pw.name AS nombre_plantilla
        FROM periodicidad_recordatorio pr
        INNER JOIN plantilla_whatsapp pw ON pw.id = pr.id_plantilla
        WHERE pr.estado_registro = 1
          AND pr.cada_horas = :cada_horas
          AND (pr.id_marca = :id_marca OR pr.id_marca IS NULL)
        ORDER BY pr.id_marca DESC NULLS LAST
        LIMIT 1
      `, {
        replacements: { cada_horas: horas, id_marca: registro.id_marca },
        type: QueryTypes.SELECT
      });

      if (!periodicidad) {
        return res.status(400).json({
          success: false,
          error: `No se encontró periodicidad para tipo ${registro.tipo_recuperacion} y marca ${registro.nombre_marca || 'sin marca'}`
        });
      }

      const nombrePlantilla = periodicidad.nombre_plantilla;

      // Obtener los campos mapeados de formato_campo_plantilla para esta plantilla
      const camposMapeados = await sequelize.query(`
        SELECT fcp.orden, fcp.id_campo_sistema, fcp.id_formato_campo, fcp.constante,
               cs.nombre AS campo_sistema_nombre,
               fc.nombre_campo AS formato_campo_nombre
        FROM formato_campo_plantilla fcp
        LEFT JOIN campo_sistema cs ON cs.id = fcp.id_campo_sistema
        LEFT JOIN formato_campo fc ON fc.id = fcp.id_formato_campo
        WHERE fcp.id_plantilla = :id_plantilla
          AND fcp.estado_registro = 1
        ORDER BY fcp.orden ASC
      `, {
        replacements: { id_plantilla: periodicidad.id_plantilla },
        type: QueryTypes.SELECT
      });

      // Obtener datos de version
      let versionData = {};
      let idModelo = registro.id_modelo;

      if (registro.id_version) {
        // Version definida: obtener directamente, filtrar por id_modelo si existe
        let versionQuery = `SELECT v.*, mo.nombre AS nombre_modelo FROM version v LEFT JOIN modelo mo ON mo.id = v.id_modelo WHERE v.id = :id_version AND v.estado_registro = 1`;
        const versionReplacements = { id_version: registro.id_version };
        if (idModelo) {
          versionQuery += ` AND v.id_modelo = :id_modelo`;
          versionReplacements.id_modelo = idModelo;
        }
        const [version] = await sequelize.query(versionQuery, { replacements: versionReplacements, type: QueryTypes.SELECT });
        if (version) {
          versionData = version;
          if (!idModelo) idModelo = version.id_modelo;
        }
      } else if (idModelo) {
        // Solo modelo definido, sin version: buscar la version con precio más bajo
        const [version] = await sequelize.query(`
          SELECT v.*, mo.nombre AS nombre_modelo FROM version v
          LEFT JOIN modelo mo ON mo.id = v.id_modelo
          WHERE v.id_modelo = :id_modelo AND v.estado_registro = 1 AND v.precio_lista IS NOT NULL
          ORDER BY v.precio_lista ASC LIMIT 1
        `, { replacements: { id_modelo: idModelo }, type: QueryTypes.SELECT });
        if (version) versionData = version;
      } else if (registro.id_marca) {
        // Ni modelo ni version: buscar la version con precio más bajo de toda la marca
        const [version] = await sequelize.query(`
          SELECT v.*, mo.nombre AS nombre_modelo FROM version v
          INNER JOIN modelo mo ON mo.id = v.id_modelo
          WHERE mo.id_marca = :id_marca AND v.estado_registro = 1 AND v.precio_lista IS NOT NULL
          ORDER BY v.precio_lista ASC LIMIT 1
        `, { replacements: { id_marca: registro.id_marca }, type: QueryTypes.SELECT });
        if (version) {
          versionData = version;
          idModelo = version.id_modelo;
        }
      }

      // Mapa de campos del sistema → valor del prospecto
      const camposSistemaValores = {
        telefono: registro.celular || '',
        nombre: registro.nombre_completo || 'estimado/a',
        correo: registro.correo || '',
        tipo_documento: registro.tipo_documento || '',
        numero_documento: registro.numero_documento || '',
        tipo_persona: '',
        fecha: new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
      };

      // Mapa de campos de marca → valor
      const marcaValores = {
        nombre: registro.nombre_marca || '',
        descripcion: registro.descripcion_marca || ''
      };

      // Mapa de campos de modelo → valor
      const modeloValores = {
        nombre: registro.nombre_modelo || versionData.nombre_modelo || '',
        descripcion: registro.descripcion_modelo || ''
      };

      // Resolver cada variable en orden
      const parameters = camposMapeados.map(campo => {
        let valor = '';

        // Prioridad 1: constante
        if (campo.constante) {
          valor = campo.constante;
        }
        // Prioridad 2: campo del sistema (prospecto)
        else if (campo.campo_sistema_nombre) {
          valor = camposSistemaValores[campo.campo_sistema_nombre] || '';
        }
        // Prioridad 3: campo del formato (version, modelo o marca según prefijo)
        else if (campo.formato_campo_nombre) {
          const nombre = campo.formato_campo_nombre;
          if (nombre.startsWith('version_')) {
            const key = nombre.replace('version_', '');
            valor = versionData[key] != null ? String(versionData[key]) : '';
          } else if (nombre.startsWith('modelo_')) {
            const key = nombre.replace('modelo_', '');
            valor = modeloValores[key] || '';
          } else if (nombre.startsWith('marca_')) {
            const key = nombre.replace('marca_', '');
            valor = marcaValores[key] || '';
          }
        }

        return { type: 'text', text: valor || '' };
      });

      // Construir components para Meta
      const components = parameters.length > 0
        ? [{ type: 'body', parameters }]
        : [];

      logger.info(`[n8nRecuperacion] registrarEnvio: marca=${registro.nombre_marca || 'N/A'}, plantilla=${nombrePlantilla}, params=${parameters.map(p => p.text).join(', ')}`);

      const whatsappResult = await whatsappGraphService.enviarPlantilla(
        registro.id_empresa,
        registro.celular,
        nombrePlantilla,
        'es',
        components
      );

      const wid_mensaje = whatsappResult?.response?.messages?.[0]?.id || null;

      const mensajeDB = await Mensaje.create({
        id_chat: registro.id_chat,
        direccion: 'out',
        tipo_mensaje: 'plantilla',
        contenido: `[Plantilla: ${nombrePlantilla}]`,
        wid_mensaje,
        contenido_archivo: null,
        id_usuario: null,
        id_plantilla_whatsapp: periodicidad.id_plantilla,
        fecha_hora: new Date(),
        usuario_registro: null,
        estado_registro: 1
      });

      logger.info(`[n8nRecuperacion] registrarEnvio: Plantilla ${nombrePlantilla} enviada para chat ${registro.id_chat}, celular: ${registro.celular}, wid: ${wid_mensaje}`);

      const esKia = registro.nombre_marca && registro.nombre_marca.toUpperCase() === 'KIA';

      const resultadoEnvio = {
        metodo_envio: 'plantilla',
        nombre_plantilla: nombrePlantilla,
        es_kia: esKia,
        marca: registro.nombre_marca || null,
        modelo: versionData.nombre_modelo || versionData.nombre || null,
        parametros: parameters.map(p => p.text),
        wid_mensaje,
        id_mensaje_registrado: mensajeDB.id
      };

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
      const metaError = error.response?.data?.error || error.response?.data || null;
      logger.error(`[n8nRecuperacion] Error registrarEnvio - id_mensaje_visto: ${req.body?.id_mensaje_visto}`);
      logger.error(`[n8nRecuperacion] Mensaje: ${error.message}`);
      logger.error(`[n8nRecuperacion] Status HTTP: ${error.response?.status || 'N/A'}`);
      if (metaError) {
        logger.error(`[n8nRecuperacion] Meta API error: ${JSON.stringify(metaError)}`);
      }
      logger.error(`[n8nRecuperacion] Stack: ${error.stack}`);
      return res.status(500).json({ success: false, error: error.message });
    }
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
