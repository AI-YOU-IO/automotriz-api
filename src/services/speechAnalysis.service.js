const { createLlmProvider } = require('./llm');
const analisisLlamadaRepo = require('../repositories/analisisLlamada.repository');
const analisisSentimientoRepo = require('../repositories/analisisSentimiento.repository');
const preguntaFrecuenteRepo = require('../repositories/preguntaFrecuente.repository');
const logger = require('../config/logger/loggerClient');

// Catálogos fijos para garantizar agregación consistente (contexto automotriz)
const CATALOGO_TEMAS = [
  'Precio del vehículo',
  'Financiamiento vehicular',
  'Disponibilidad de modelos',
  'Versiones y equipamiento',
  'Agenda de cita',
  'Prueba de manejo',
  'Promociones y descuentos',
  'Seguro vehicular',
  'Fecha de entrega',
  'Documentación requerida',
  'Crédito automotriz',
  'Cuota inicial',
  'Características del vehículo',
  'Garantía y mantenimiento',
  'Repuestos y accesorios',
  'Postventa y servicio técnico',
  'Comparación de modelos',
  'Cancelación o devolución',
  'Requisitos de compra',
  'Otro'
];

const CATALOGO_PREGUNTAS = [
  '¿Cuál es el precio?',
  '¿Qué financiamiento ofrecen?',
  '¿Tienen disponibilidad del modelo?',
  '¿Qué versiones tienen?',
  '¿Cuál es el equipamiento?',
  '¿Puedo hacer prueba de manejo?',
  '¿Tienen promociones?',
  '¿Cuándo es la entrega?',
  '¿Qué documentos necesito?',
  '¿Cuánto es la cuota inicial?',
  '¿Cuánto sería la cuota mensual?',
  '¿Tienen vehículos en stock?',
  '¿Puedo agendar una visita?',
  '¿Qué garantía tiene?',
  '¿Aceptan vehículo como parte de pago?',
  '¿Qué colores tienen disponibles?',
  '¿Cuál es el rendimiento de combustible?',
  '¿Tienen otros modelos?',
  '¿Puedo cancelar o devolver?',
  '¿Cómo es el proceso de compra?',
  'Otra consulta'
];

const SYSTEM_PROMPT = `Eres un analista de conversaciones telefónicas de una empresa automotriz (concesionaria de vehículos).
Analiza la siguiente transcripción de una llamada entre un agente de IA y un prospecto/cliente.

Debes responder ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{
  "sentimiento": "positivo" | "negativo" | "neutro",
  "score_sentimiento": 0.0 a 1.0,
  "emocion_principal": "satisfaccion" | "frustracion" | "enojo" | "confusion" | "ansiedad" | "desconfianza" | "decepcion" | "gratitud" | "entusiasmo" | "curiosidad" | "confianza" | "calma" | "indiferencia",
  "score_emocion": 0.0 a 1.0,
  "fcr": true | false,
  "total_palabras": número total de palabras en toda la conversación,
  "tiempo_habla_estimado_seg": estimación en segundos (aprox 2.5 palabras/segundo),
  "cumplimiento_protocolo": 0.0 a 1.0 (qué tan bien siguió el agente el flujo de ventas: saludo, descubrimiento, información, cierre),
  "preguntas": [{"contenido": "pregunta del catálogo", "frecuencia": 1}],
  "temas": [{"contenido": "tema del catálogo", "frecuencia": 1}],
  "palabras_clave": [{"contenido": "palabra", "frecuencia": número de veces que aparece}]
}

CATÁLOGO DE TEMAS (usa SOLO estos valores exactos en "temas"):
${CATALOGO_TEMAS.map(t => `- "${t}"`).join('\n')}

CATÁLOGO DE PREGUNTAS (usa SOLO estos valores exactos en "preguntas"):
${CATALOGO_PREGUNTAS.map(p => `- "${p}"`).join('\n')}

Reglas:
- "fcr" (First Call Resolution): true si la llamada resolvió el objetivo del prospecto (agendó cita, obtuvo la info que necesitaba, se derivó correctamente). false si quedó pendiente, se cortó, o el prospecto no obtuvo lo que buscaba.
- "preguntas": selecciona del catálogo las que el prospecto preguntó (máximo 5). Si ninguna aplica, usa "Otra consulta".
- "temas": selecciona del catálogo los que se tocaron en la conversación (máximo 5). Si ninguno aplica, usa "Otro".
- "palabras_clave": las 10 palabras más relevantes y frecuentes (excluye artículos, preposiciones, pronombres). Estas SÍ son libres.
- El sentimiento es sobre la actitud general del PROSPECTO durante la llamada.
- La emoción principal es la emoción dominante del PROSPECTO.
- IMPORTANTE: En "temas" y "preguntas" SOLO usa valores exactos del catálogo. No inventes variaciones.`;

class SpeechAnalysisService {
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
   * Analiza una transcripción y guarda los resultados en las 3 tablas de speech analytics.
   * @param {number} idLlamada - ID de la llamada
   * @param {Array} transcripcion - Array de mensajes [{speaker_role, texto}]
   * @param {number} idEmpresa - ID de la empresa
   * @param {number} duracionSeg - Duración real de la llamada en segundos (opcional)
   */
  async analizarTranscripcion(idLlamada, transcripcion, idEmpresa, duracionSeg) {
    try {
      if (!transcripcion || transcripcion.length === 0) {
        logger.warn(`[speechAnalysis] Transcripción vacía para llamada ${idLlamada}, omitiendo análisis`);
        return null;
      }

      // Construir texto de la conversación
      const textoConversacion = transcripcion.map(m => {
        const rol = m.speaker_role === 'ai' ? 'Agente' : m.speaker_role === 'humano' ? 'Prospecto' : 'Sistema';
        return `${rol}: ${m.texto}`;
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
        logger.error(`[speechAnalysis] Error parseando respuesta LLM para llamada ${idLlamada}: ${parseError.message}`);
        logger.error(`[speechAnalysis] Respuesta raw: ${response.content}`);
        return null;
      }

      // Calcular tiempos
      const tiempoHablaSeg = duracionSeg || analisis.tiempo_habla_estimado_seg || 0;
      const tiempoSilencioSeg = duracionSeg ? Math.max(0, Math.round(duracionSeg * 0.15)) : 0;

      // 1. Guardar análisis de llamada
      await analisisLlamadaRepo.create({
        id_llamada: idLlamada,
        total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        total_palabras: analisis.total_palabras || 0,
        tiempo_habla_seg: Math.round(tiempoHablaSeg),
        tiempo_silencio_seg: tiempoSilencioSeg,
        cumplimiento_protocolo: analisis.cumplimiento_protocolo || 0,
        fcr: analisis.fcr || false,
        id_empresa: idEmpresa
      });

      // 2. Guardar análisis de sentimiento
      await analisisSentimientoRepo.create({
        id_llamada: idLlamada,
        sentimiento: analisis.sentimiento || 'neutro',
        score_sentimiento: analisis.score_sentimiento || 0,
        emocion_principal: analisis.emocion_principal || 'indiferencia',
        score_emocion: analisis.score_emocion || 0,
        id_empresa: idEmpresa
      });

      // 3. Guardar preguntas, temas y palabras clave (validados contra catálogo)
      const preguntasData = [];

      if (analisis.preguntas && analisis.preguntas.length > 0) {
        for (const p of analisis.preguntas) {
          const contenido = CATALOGO_PREGUNTAS.includes(p.contenido) ? p.contenido : 'Otra consulta';
          preguntasData.push({
            id_llamada: idLlamada,
            tipo: 'pregunta',
            contenido,
            frecuencia: p.frecuencia || 1,
            id_empresa: idEmpresa
          });
        }
      }

      if (analisis.temas && analisis.temas.length > 0) {
        for (const t of analisis.temas) {
          const contenido = CATALOGO_TEMAS.includes(t.contenido) ? t.contenido : 'Otro';
          preguntasData.push({
            id_llamada: idLlamada,
            tipo: 'tema',
            contenido,
            frecuencia: t.frecuencia || 1,
            id_empresa: idEmpresa
          });
        }
      }

      if (analisis.palabras_clave && analisis.palabras_clave.length > 0) {
        for (const w of analisis.palabras_clave) {
          preguntasData.push({
            id_llamada: idLlamada,
            tipo: 'palabra',
            contenido: w.contenido,
            frecuencia: w.frecuencia || 1,
            id_empresa: idEmpresa
          });
        }
      }

      if (preguntasData.length > 0) {
        await preguntaFrecuenteRepo.bulkCreate(preguntasData);
      }

      logger.info(`[speechAnalysis] Análisis completado para llamada ${idLlamada}: sentimiento=${analisis.sentimiento}, fcr=${analisis.fcr}, ${preguntasData.length} registros de preguntas/temas/palabras`);

      return analisis;
    } catch (error) {
      logger.error(`[speechAnalysis] Error al analizar llamada ${idLlamada}: ${error.message}`);
      return null;
    }
  }
}

module.exports = new SpeechAnalysisService();
