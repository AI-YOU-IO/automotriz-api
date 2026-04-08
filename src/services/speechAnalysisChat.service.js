const { sequelize } = require('../models/sequelize/index.js');
const { QueryTypes } = require('sequelize');
const { createLlmProvider } = require('./llm');
const analisisLlamadaRepo = require('../repositories/analisisLlamada.repository');
const analisisSentimientoRepo = require('../repositories/analisisSentimiento.repository');
const preguntaFrecuenteRepo = require('../repositories/preguntaFrecuente.repository');
const logger = require('../config/logger/loggerClient');

// Mismos catálogos que speechAnalysis.service.js (contexto automotriz)
const CATALOGO_TEMAS = [
  'Precio del vehículo', 'Financiamiento vehicular', 'Disponibilidad de modelos',
  'Versiones y equipamiento', 'Agenda de cita', 'Prueba de manejo',
  'Promociones y descuentos', 'Seguro vehicular', 'Fecha de entrega',
  'Documentación requerida', 'Crédito automotriz', 'Cuota inicial',
  'Características del vehículo', 'Garantía y mantenimiento', 'Repuestos y accesorios',
  'Postventa y servicio técnico', 'Comparación de modelos',
  'Cancelación o devolución', 'Requisitos de compra', 'Otro'
];

const CATALOGO_PREGUNTAS = [
  '¿Cuál es el precio?', '¿Qué financiamiento ofrecen?', '¿Tienen disponibilidad del modelo?',
  '¿Qué versiones tienen?', '¿Cuál es el equipamiento?', '¿Puedo hacer prueba de manejo?',
  '¿Tienen promociones?', '¿Cuándo es la entrega?', '¿Qué documentos necesito?',
  '¿Cuánto es la cuota inicial?', '¿Cuánto sería la cuota mensual?',
  '¿Tienen vehículos en stock?', '¿Puedo agendar una visita?',
  '¿Qué garantía tiene?', '¿Aceptan vehículo como parte de pago?',
  '¿Qué colores tienen disponibles?', '¿Cuál es el rendimiento de combustible?',
  '¿Tienen otros modelos?', '¿Puedo cancelar o devolver?',
  '¿Cómo es el proceso de compra?', 'Otra consulta'
];

const SYSTEM_PROMPT = `Eres un analista de conversaciones de WhatsApp de una empresa automotriz (concesionaria de vehículos).
Analiza la siguiente conversación entre un agente de IA (bot) y un prospecto/cliente por WhatsApp.

Debes responder ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{
  "sentimiento": "positivo" | "negativo" | "neutro",
  "score_sentimiento": 0.0 a 1.0,
  "emocion_principal": "satisfaccion" | "frustracion" | "enojo" | "confusion" | "ansiedad" | "desconfianza" | "decepcion" | "gratitud" | "entusiasmo" | "curiosidad" | "confianza" | "calma" | "indiferencia",
  "score_emocion": 0.0 a 1.0,
  "total_palabras": número total de palabras en toda la conversación,
  "cumplimiento_protocolo": 0.0 a 1.0,
  "preguntas": [{"contenido": "pregunta del catálogo", "frecuencia": 1}],
  "temas": [{"contenido": "tema del catálogo", "frecuencia": 1}],
  "palabras_clave": [{"contenido": "palabra", "frecuencia": número}]
}

CATÁLOGO DE TEMAS (usa SOLO estos valores exactos):
${CATALOGO_TEMAS.map(t => `- "${t}"`).join('\n')}

CATÁLOGO DE PREGUNTAS (usa SOLO estos valores exactos):
${CATALOGO_PREGUNTAS.map(p => `- "${p}"`).join('\n')}

Reglas:
- "preguntas": selecciona del catálogo las que el prospecto preguntó (máximo 5). Si ninguna aplica, usa "Otra consulta".
- "temas": selecciona del catálogo los que se tocaron (máximo 5). Si ninguno aplica, usa "Otro".
- "palabras_clave": las 10 palabras más relevantes (excluye artículos, preposiciones). Estas SÍ son libres.
- El sentimiento es sobre la actitud general del PROSPECTO.
- La emoción principal es la emoción dominante del PROSPECTO.
- Ignora mensajes de tipo [video], [imagen], [audio], [documento] — solo analiza texto.
- IMPORTANTE: En "temas" y "preguntas" SOLO usa valores exactos del catálogo.`;

class SpeechAnalysisChatService {
  constructor() {
    this.llm = null;
  }

  getLlm() {
    if (!this.llm) {
      this.llm = createLlmProvider();
    }
    return this.llm;
  }

  /**
   * Busca chats inactivos (>24h sin mensajes) que no han sido analizados y los analiza.
   *
   * NOTA: Este servicio requiere que las tablas analisis_llamada, analisis_sentimiento
   * y pregunta_frecuente tengan la columna id_chat (actualmente no existe en BD).
   * También requiere que id_llamada sea nullable.
   * Mientras no se hagan esos cambios en BD, este servicio NO funcionará.
   *
   * @param {number} idEmpresa - ID de la empresa
   * @returns {Object} { analizados, errores }
   */
  async analizarChatsInactivos(idEmpresa) {
    let analizados = 0;
    let errores = 0;

    try {
      // Buscar chats con último mensaje > 24h que NO tienen análisis
      const chats = await sequelize.query(`
        SELECT c.id as id_chat, c.id_prospecto, p.nombre_completo, p.id_empresa,
               MAX(m.fecha_hora) as ultimo_mensaje,
               COUNT(m.id) as total_mensajes
        FROM chat c
        JOIN prospecto p ON p.id = c.id_prospecto
        JOIN mensaje m ON m.id_chat = c.id AND m.estado_registro = 1
        LEFT JOIN analisis_sentimiento ans ON ans.id_chat = c.id AND ans.estado_registro = 1
        WHERE c.estado_registro = 1
          AND p.id_empresa = :idEmpresa
          AND ans.id IS NULL
        GROUP BY c.id, c.id_prospecto, p.nombre_completo, p.id_empresa
        HAVING MAX(m.fecha_hora) < NOW() - INTERVAL '24 hours'
           AND COUNT(m.id) >= 3
        ORDER BY MAX(m.fecha_hora) DESC
        LIMIT 50
      `, { replacements: { idEmpresa }, type: QueryTypes.SELECT });

      logger.info(`[speechAnalysisChat] Encontrados ${chats.length} chats para analizar (empresa ${idEmpresa})`);

      for (const chat of chats) {
        try {
          await this.analizarChat(chat.id_chat, idEmpresa);
          analizados++;
        } catch (err) {
          errores++;
          logger.error(`[speechAnalysisChat] Error analizando chat ${chat.id_chat}: ${err.message}`);
        }
      }

      logger.info(`[speechAnalysisChat] Resultado: ${analizados} analizados, ${errores} errores`);
    } catch (error) {
      logger.error(`[speechAnalysisChat] Error general: ${error.message}`);
    }

    return { analizados, errores };
  }

  /**
   * Analiza un chat específico
   */
  async analizarChat(idChat, idEmpresa) {
    // Obtener mensajes del chat
    const mensajes = await sequelize.query(`
      SELECT direccion, contenido, fecha_hora
      FROM mensaje
      WHERE id_chat = :idChat AND estado_registro = 1 AND contenido IS NOT NULL AND contenido != ''
      ORDER BY fecha_hora ASC
    `, { replacements: { idChat }, type: QueryTypes.SELECT });

    if (mensajes.length < 3) {
      logger.warn(`[speechAnalysisChat] Chat ${idChat} tiene menos de 3 mensajes, omitiendo`);
      return null;
    }

    // Construir transcripción
    const textoConversacion = mensajes.map(m => {
      const rol = m.direccion === 'in' ? 'Prospecto' : 'Agente';
      return `${rol}: ${m.contenido}`;
    }).join('\n');

    // Llamar al LLM
    const llm = this.getLlm();
    const response = await llm.chat({
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: textoConversacion }],
      model: process.env.SPEECH_ANALYSIS_MODEL || 'gpt-4o-mini',
      temperature: 0.1
    });

    // Parsear respuesta
    let analisis;
    try {
      const content = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analisis = JSON.parse(content);
    } catch (parseError) {
      logger.error(`[speechAnalysisChat] Error parseando LLM para chat ${idChat}: ${parseError.message}`);
      return null;
    }

    // 1. Guardar análisis de llamada (reutilizamos tabla, con id_chat)
    await analisisLlamadaRepo.create({
      id_llamada: null,
      id_chat: idChat,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      total_palabras: analisis.total_palabras || 0,
      tiempo_habla_seg: 0,
      tiempo_silencio_seg: 0,
      cumplimiento_protocolo: analisis.cumplimiento_protocolo || 0,
      fcr: false,
      id_empresa: idEmpresa
    });

    // 2. Guardar sentimiento
    await analisisSentimientoRepo.create({
      id_llamada: null,
      id_chat: idChat,
      sentimiento: analisis.sentimiento || 'neutro',
      score_sentimiento: analisis.score_sentimiento || 0,
      emocion_principal: analisis.emocion_principal || 'indiferencia',
      score_emocion: analisis.score_emocion || 0,
      id_empresa: idEmpresa
    });

    // 3. Guardar preguntas, temas y palabras
    const preguntasData = [];

    if (analisis.preguntas?.length > 0) {
      for (const p of analisis.preguntas) {
        const contenido = CATALOGO_PREGUNTAS.includes(p.contenido) ? p.contenido : 'Otra consulta';
        preguntasData.push({ id_llamada: null, id_chat: idChat, tipo: 'pregunta', contenido, frecuencia: p.frecuencia || 1, id_empresa: idEmpresa });
      }
    }

    if (analisis.temas?.length > 0) {
      for (const t of analisis.temas) {
        const contenido = CATALOGO_TEMAS.includes(t.contenido) ? t.contenido : 'Otro';
        preguntasData.push({ id_llamada: null, id_chat: idChat, tipo: 'tema', contenido, frecuencia: t.frecuencia || 1, id_empresa: idEmpresa });
      }
    }

    if (analisis.palabras_clave?.length > 0) {
      for (const w of analisis.palabras_clave) {
        preguntasData.push({ id_llamada: null, id_chat: idChat, tipo: 'palabra', contenido: w.contenido, frecuencia: w.frecuencia || 1, id_empresa: idEmpresa });
      }
    }

    if (preguntasData.length > 0) {
      await preguntaFrecuenteRepo.bulkCreate(preguntasData);
    }

    logger.info(`[speechAnalysisChat] Chat ${idChat} analizado: sentimiento=${analisis.sentimiento}, ${preguntasData.length} registros`);
    return analisis;
  }
}

module.exports = new SpeechAnalysisChatService();
