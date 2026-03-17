/**
 * Servidor Express independiente para pruebas de estrés.
 *
 * Simula el flujo conversacional real de Vera (VIVA Negocio Inmobiliario):
 *   1. Saludo → Vera se presenta y pregunta en qué puede ayudar
 *   2. Nombre → Vera pregunta por proyectos/lugar de interés
 *   3. Propósito → Vera pregunta en qué distrito busca
 *   4. Distrito → Vera informa proyectos disponibles y pide autorización de datos
 *   5. Autorización → Vera confirma derivación a asesor
 *
 * Mocks: WhatsApp y LLM (no llama a Meta ni OpenAI)
 * Real:  Base de datos (mide rendimiento de queries)
 *
 * Modos:
 *   POST /api/stress-test/message          → Async (responde 200 inmediato, procesa en background)
 *   POST /api/stress-test/message?sync=true → Sync (espera procesamiento, retorna timing real)
 *
 * Uso:
 *   node tests/stress/stress-server.js
 *   (luego: k6 run tests/stress/test-bot.js)
 *
 * Puerto: 3099 (configurable con PORT_STRESS)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');

// Repositorios reales
const Prospecto = require("../../src/repositories/prospecto.repository");
const Usuario = require("../../src/repositories/usuario.repository");
const Chat = require("../../src/repositories/chat.repository");
const Mensaje = require("../../src/repositories/mensaje.repository");
const logger = require("../../src/config/logger/loggerClient");
const { sequelize } = require("../../src/config/database");

const app = express();
app.use(express.json());

const PORT = process.env.PORT_STRESS || 3099;

// ============================================================
// RING BUFFER - Estructura de capacidad fija para métricas
// ============================================================

class RingBuffer {
    constructor(capacity = 10000) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.head = 0;
        this.size = 0;
        this.sum = 0;
        this.count = 0;
        this.min = Infinity;
        this.max = -Infinity;
    }

    push(value) {
        // Si el buffer está lleno, restar el valor que se sobreescribe
        if (this.size === this.capacity) {
            this.sum -= this.buffer[this.head] || 0;
        }
        this.buffer[this.head] = value;
        this.head = (this.head + 1) % this.capacity;
        if (this.size < this.capacity) this.size++;
        this.sum += value;
        this.count++;
        if (value < this.min) this.min = value;
        if (value > this.max) this.max = value;
    }

    toArray() {
        if (this.size === 0) return [];
        if (this.size < this.capacity) {
            return this.buffer.slice(0, this.size);
        }
        return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
    }

    get length() { return this.size; }
    get runningAvg() { return this.count > 0 ? Math.round(this.sum / this.count) : 0; }

    reset() {
        this.buffer = new Array(this.capacity);
        this.head = 0;
        this.size = 0;
        this.sum = 0;
        this.count = 0;
        this.min = Infinity;
        this.max = -Infinity;
    }
}

// ============================================================
// FLUJO CONVERSACIONAL REAL DE VERA (VIVA)
// ============================================================

const conversaciones = {};

const FLUJO_VERA = {
    saludo: {
        respuesta: "Hola, soy Vera 🙋‍♀️, tu asesora de VIVA Negocio Inmobiliario 💚. En que puedo ayudarte hoy?😊",
        tokens_prompt: 150,
        tokens_completion: 35,
        latencia_base: 300,
        siguiente: 'nombre'
    },
    nombre: {
        respuesta: "Perfecto, {nombre} 😊. ¿Estás interesado en alguno de nuestros proyectos? Si es así, indícame en ¿qué lugar estás interesado? 😊",
        tokens_prompt: 350,
        tokens_completion: 38,
        latencia_base: 400,
        siguiente: 'proposito'
    },
    proposito: {
        respuesta: "Excelente, gracias por tu respuesta 😊. ¿Cuéntame, en qué distrito estás buscando o conoces algún proyecto?",
        tokens_prompt: 580,
        tokens_completion: 28,
        latencia_base: 450,
        siguiente: 'distrito'
    },
    distrito: {
        respuesta: "En este momento estoy manejando información de nuestro proyecto Acacias Villa Residencial / Lirios Villa Residencial, en {distrito}. Te voy a derivar con mi compañero para que te brinde más detalles del proyecto que te interesa, para lo cual, necesito me autorices el tratamiento de tus datos personales según la normativa vigente. ¿Me das tu autorización para continuar?",
        tokens_prompt: 900,
        tokens_completion: 72,
        latencia_base: 600,
        siguiente: 'autorizacion'
    },
    autorizacion: {
        respuesta: "Perfecto, {nombre}. Estoy derivando tu consulta a uno de mis compañeros para que te brinde más detalles del proyecto que te interesa en {distrito}. En breve recibirás una llamada. ¿Hay algo más en lo que pueda ayudarte hoy?",
        tokens_prompt: 1200,
        tokens_completion: 55,
        latencia_base: 500,
        siguiente: 'completado'
    },
    completado: {
        respuesta: "¡Gracias por contactarnos! Si tienes alguna otra consulta, no dudes en escribirme. ¡Que tengas un excelente día! 💚",
        tokens_prompt: 1400,
        tokens_completion: 30,
        latencia_base: 350,
        siguiente: 'completado'
    }
};

/**
 * Mock del LLM con flujo conversacional de Vera.
 * La latencia escala con el tamaño del prompt (simula comportamiento real de GPT).
 */
async function mockLLM(phone, message) {
    if (!conversaciones[phone]) {
        conversaciones[phone] = { paso: 'saludo', datos: {} };
    }

    const estado = conversaciones[phone];
    const pasoActual = FLUJO_VERA[estado.paso];

    // Extraer datos del mensaje del usuario
    if (estado.paso === 'nombre') {
        // Extraer nombre del mensaje (ej: "Hola mi nombre es Diego" → "Diego")
        const match = message.match(/(?:soy|nombre es|me llamo)\s+(\w+)/i);
        estado.datos.nombre = match ? match[1] : message.split(' ').pop() || 'Cliente';
    } else if (estado.paso === 'distrito') {
        estado.datos.distrito = message.trim() || 'Lima';
    }

    // Simular latencia proporcional al prompt (como un LLM real)
    const variacion = Math.random() * 0.4 + 0.8; // 0.8x - 1.2x
    const latencia = Math.round(pasoActual.latencia_base * variacion);
    await new Promise(r => setTimeout(r, latencia));

    // Personalizar respuesta
    let respuesta = pasoActual.respuesta;
    respuesta = respuesta.replace(/{nombre}/g, estado.datos.nombre || 'Cliente');
    respuesta = respuesta.replace(/{distrito}/g, estado.datos.distrito || 'la zona');

    const tokensPerSecond = Math.round((pasoActual.tokens_completion / latencia) * 1000);
    const pasoAnterior = estado.paso;
    estado.paso = pasoActual.siguiente;

    return {
        respuesta,
        latencia,
        tokens_prompt: pasoActual.tokens_prompt,
        tokens_completion: pasoActual.tokens_completion,
        tokens_total: pasoActual.tokens_prompt + pasoActual.tokens_completion,
        tokens_per_second: tokensPerSecond,
        paso: pasoAnterior
    };
}

let contadorMensajes = 0;

function mockWhatsappEnviar(tipo, phone) {
    contadorMensajes++;
    return {
        success: true,
        wid_mensaje: `wamid.mock_${tipo}_${contadorMensajes}_${Date.now()}`
    };
}

// ============================================================
// Funciones auxiliares (de messageProcessing)
// ============================================================

function mapearTipoMensaje(whatsappType) {
    const mapping = {
        'text': 'texto', 'image': 'imagen', 'audio': 'audio', 'voice': 'audio',
        'document': 'documento', 'video': 'video', 'sticker': 'sticker',
        'location': 'ubicacion', 'contacts': 'contacto'
    };
    return mapping[whatsappType] || 'texto';
}

const FORMATO_A_TIPO = {
    '.jpg': 'imagen', '.jpeg': 'imagen', '.png': 'imagen', '.gif': 'imagen',
    '.webp': 'imagen', '.mp4': 'video', '.mov': 'video',
    '.mp3': 'audio', '.ogg': 'audio', '.wav': 'audio',
    '.pdf': 'documento', '.doc': 'documento', '.docx': 'documento',
    '.xls': 'documento', '.xlsx': 'documento'
};

const URLS_WHITELIST = [/google\.\w+\/maps/i, /maps\.google/i, /goo\.gl\/maps/i];

function procesarURLs(texto) {
    if (!texto) return { urls: [], textoLimpio: texto };
    const urlRegex = /(https?:\/\/[^\s\)\]]+|\/uploads\/[^\s\)\]]+)/gi;
    const urlsRaw = texto.match(urlRegex) || [];
    const urlsFiltradas = urlsRaw.filter(u => !URLS_WHITELIST.some(p => p.test(u)));

    const urls = [];
    for (const url of urlsFiltradas) {
        const urlLower = url.toLowerCase();
        for (const [ext, tipo] of Object.entries(FORMATO_A_TIPO)) {
            if (urlLower.includes(ext)) {
                urls.push({ url: url.trim(), tipo });
                break;
            }
        }
    }

    let textoLimpio = texto;
    for (const url of urlsFiltradas) textoLimpio = textoLimpio.replace(url, '');
    textoLimpio = textoLimpio.split('\n')
        .filter(l => l.replace(/!?\[[^\]]*\]\(\s*\)/g, '').replace(/[-•*>\s]/g, '').length > 0)
        .join('\n').trim();

    return { urls, textoLimpio };
}

// ============================================================
// MÉTRICAS AVANZADAS (con RingBuffer)
// ============================================================

const metricas = {
    totalRequests: 0,
    exitosos: 0,
    errores: 0,
    inicio: Date.now(),

    // Latencias por dependencia (RingBuffer: max 10K muestras)
    tiemposTotal: new RingBuffer(10000),
    tiemposLLM: new RingBuffer(10000),
    tiemposDB: new RingBuffer(10000),
    tiemposWA: new RingBuffer(10000),

    // Tokens
    tokensPromptTotal: 0,
    tokensCompletionTotal: 0,
    tokensPerSecondSamples: new RingBuffer(10000),

    // Por paso del funnel
    porPaso: {
        saludo: { count: 0, latencias: new RingBuffer(5000) },
        nombre: { count: 0, latencias: new RingBuffer(5000) },
        proposito: { count: 0, latencias: new RingBuffer(5000) },
        distrito: { count: 0, latencias: new RingBuffer(5000) },
        autorizacion: { count: 0, latencias: new RingBuffer(5000) },
        completado: { count: 0, latencias: new RingBuffer(5000) }
    },

    // Concurrencia
    concurrenciaActual: 0,
    concurrenciaMax: 0,
    historialConcurrencia: [],

    registrarInicioConcurrencia() {
        this.concurrenciaActual++;
        if (this.concurrenciaActual > this.concurrenciaMax) {
            this.concurrenciaMax = this.concurrenciaActual;
        }
        if (this.totalRequests % 5 === 0) {
            this.historialConcurrencia.push({
                timestamp: Date.now(),
                concurrentes: this.concurrenciaActual,
                latencia: 0
            });
            if (this.historialConcurrencia.length > 500) {
                this.historialConcurrencia.shift();
            }
        }
    },

    registrarFinConcurrencia(latencia) {
        if (this.historialConcurrencia.length > 0) {
            const ultima = this.historialConcurrencia[this.historialConcurrencia.length - 1];
            if (ultima.latencia === 0) {
                ultima.latencia = latencia;
            }
        }
        this.concurrenciaActual--;
    },

    resumen() {
        const stats = (source) => {
            const arr = source instanceof RingBuffer ? source.toArray() : source;
            if (!arr.length) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 };
            const s = [...arr].sort((a, b) => a - b);
            return {
                min: s[0], max: s[s.length - 1],
                avg: Math.round(s.reduce((a, b) => a + b, 0) / s.length),
                p50: s[Math.floor(s.length * 0.50)] || 0,
                p95: s[Math.floor(s.length * 0.95)] || s[s.length - 1],
                p99: s[Math.floor(s.length * 0.99)] || s[s.length - 1],
                count: source instanceof RingBuffer ? source.count : s.length
            };
        };

        const uptimeS = (Date.now() - this.inicio) / 1000;

        // Evaluar estabilidad de concurrencia
        let estabilidadConcurrencia = 'sin datos suficientes';
        if (this.historialConcurrencia.length >= 10) {
            const muestras = this.historialConcurrencia;
            const bajaCarga = muestras.filter(m => m.concurrentes <= 5);
            const altaCarga = muestras.filter(m => m.concurrentes >= 20);
            if (bajaCarga.length > 0 && altaCarga.length > 0) {
                const avgBaja = bajaCarga.reduce((a, m) => a + m.latencia, 0) / bajaCarga.length;
                const avgAlta = altaCarga.reduce((a, m) => a + m.latencia, 0) / altaCarga.length;
                const ratio = avgAlta / avgBaja;
                if (ratio < 1.5) estabilidadConcurrencia = `EXCELENTE - ratio ${ratio.toFixed(2)}x (< 1.5x)`;
                else if (ratio < 2.5) estabilidadConcurrencia = `BUENA - ratio ${ratio.toFixed(2)}x (< 2.5x)`;
                else if (ratio < 5) estabilidadConcurrencia = `REGULAR - ratio ${ratio.toFixed(2)}x (< 5x)`;
                else estabilidadConcurrencia = `MALA - ratio ${ratio.toFixed(2)}x (>= 5x, latencia exponencial)`;
            }
        }

        // Funnel
        const funnel = {};
        for (const [paso, data] of Object.entries(this.porPaso)) {
            funnel[paso] = { count: data.count, latencia: stats(data.latencias) };
        }

        const avgTPS = this.tokensPerSecondSamples.length > 0
            ? Math.round(this.tokensPerSecondSamples.toArray().reduce((a, b) => a + b, 0) / this.tokensPerSecondSamples.length)
            : 0;

        // Pool de conexiones BD
        let poolStats = null;
        try {
            const pool = sequelize.connectionManager.pool;
            poolStats = {
                size: pool.size,
                available: pool.available,
                using: pool.using,
                waiting: pool.waiting,
                max: sequelize.config.pool?.max || 100,
                min: sequelize.config.pool?.min || 10
            };
        } catch (e) { poolStats = { error: e.message }; }

        return {
            resumen_general: {
                totalRequests: this.totalRequests,
                exitosos: this.exitosos,
                errores: this.errores,
                tasaError: this.totalRequests > 0 ? `${((this.errores / this.totalRequests) * 100).toFixed(2)}%` : '0%',
                requestsPorSegundo: uptimeS > 0 ? (this.totalRequests / uptimeS).toFixed(2) : 0,
                uptimeSegundos: Math.round(uptimeS),
            },
            latencia_inferencia: {
                descripcion: "Tiempo total de respuesta (BD + LLM + WA mock)",
                ...stats(this.tiemposTotal)
            },
            rendimiento_tokens: {
                descripcion: "Throughput simulado del LLM",
                tokens_prompt_total: this.tokensPromptTotal,
                tokens_completion_total: this.tokensCompletionTotal,
                tokens_total: this.tokensPromptTotal + this.tokensCompletionTotal,
                tokens_por_segundo_avg: avgTPS,
                tokens_por_segundo_detalle: stats(this.tokensPerSecondSamples)
            },
            estabilidad_concurrencia: {
                descripcion: "Cómo escala la latencia al subir usuarios concurrentes",
                concurrencia_actual: this.concurrenciaActual,
                concurrencia_maxima: this.concurrenciaMax,
                evaluacion: estabilidadConcurrencia,
                ultimas_muestras: this.historialConcurrencia.slice(-20)
            },
            latencia_dependencias: {
                descripcion: "Latencia desglosada por servicio",
                base_datos: stats(this.tiemposDB),
                llm_mock: stats(this.tiemposLLM),
                whatsapp_mock: stats(this.tiemposWA)
            },
            pool_conexiones: poolStats,
            ventana_60s: metricasVentana.resumen(),
            funnel_conversacional: funnel,
            mensajes_wa_simulados: contadorMensajes,
            conversaciones_activas: Object.keys(conversaciones).length
        };
    },

    reset() {
        this.totalRequests = 0;
        this.exitosos = 0;
        this.errores = 0;
        this.tiemposTotal.reset();
        this.tiemposLLM.reset();
        this.tiemposDB.reset();
        this.tiemposWA.reset();
        this.tokensPromptTotal = 0;
        this.tokensCompletionTotal = 0;
        this.tokensPerSecondSamples.reset();
        this.concurrenciaActual = 0;
        this.concurrenciaMax = 0;
        this.historialConcurrencia = [];
        this.inicio = Date.now();
        contadorMensajes = 0;
        for (const paso of Object.values(this.porPaso)) {
            paso.count = 0;
            paso.latencias.reset();
        }
        for (const key of Object.keys(conversaciones)) delete conversaciones[key];
        metricasVentana.reset();
    }
};

// ============================================================
// MÉTRICAS CON VENTANA TEMPORAL (últimos 60 segundos)
// ============================================================

const metricasVentana = {
    entries: [],
    windowMs: 60000,

    registrar(totalMs, dbMs, llmMs, waMs, paso) {
        const now = Date.now();
        this.entries.push({ timestamp: now, total: totalMs, db: dbMs, llm: llmMs, wa: waMs, paso });
        // Podar entradas antiguas
        const cutoff = now - this.windowMs;
        while (this.entries.length > 0 && this.entries[0].timestamp < cutoff) {
            this.entries.shift();
        }
    },

    resumen() {
        if (this.entries.length === 0) return null;
        const totals = this.entries.map(e => e.total);
        const sorted = [...totals].sort((a, b) => a - b);
        const dbTotals = this.entries.map(e => e.db).sort((a, b) => a - b);
        const llmTotals = this.entries.map(e => e.llm).sort((a, b) => a - b);
        return {
            ventana_segundos: this.windowMs / 1000,
            count: this.entries.length,
            rps: (this.entries.length / (this.windowMs / 1000)).toFixed(2),
            total: {
                avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
                p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1],
            },
            db: {
                avg: Math.round(dbTotals.reduce((a, b) => a + b, 0) / dbTotals.length),
                p95: dbTotals[Math.floor(dbTotals.length * 0.95)] || dbTotals[dbTotals.length - 1],
            },
            llm: {
                avg: Math.round(llmTotals.reduce((a, b) => a + b, 0) / llmTotals.length),
                p95: llmTotals[Math.floor(llmTotals.length * 0.95)] || llmTotals[llmTotals.length - 1],
            }
        };
    },

    reset() { this.entries = []; }
};

// ============================================================
// ENDPOINTS
// ============================================================

app.post('/api/stress-test/message', async (req, res) => {
    const t0 = Date.now();
    metricas.totalRequests++;
    metricas.registrarInicioConcurrencia();

    const syncMode = req.query.sync === 'true';

    // --- Validación de input ---
    let { phone, question, wid, id_empresa, messageType, files } = req.body || {};
    phone = phone?.trim() || '';
    question = question?.trim() || '';
    wid = wid ? wid.trim() : null;
    id_empresa = id_empresa ? parseInt(id_empresa, 10) : null;
    messageType = messageType || 'text';
    files = files || [];

    if (!phone || phone.length < 5 || phone.length > 20) {
        metricas.errores++;
        metricas.registrarFinConcurrencia(0);
        if (syncMode) {
            return res.status(400).json({ status: "error", error: "Invalid phone: must be 5-20 characters", timing: { total_ms: Date.now() - t0 } });
        }
        return res.status(200).json({ status: "received", message: "Mensaje recibido (stress-test)" });
    }
    if (question.length > 5000) {
        metricas.errores++;
        metricas.registrarFinConcurrencia(0);
        if (syncMode) {
            return res.status(400).json({ status: "error", error: "Invalid question: max 5000 characters", timing: { total_ms: Date.now() - t0 } });
        }
        return res.status(200).json({ status: "received", message: "Mensaje recibido (stress-test)" });
    }

    // En modo async, responder inmediato (backward compatible)
    if (!syncMode) {
        res.status(200).json({ status: "received", message: "Mensaje recibido (stress-test)" });
    }

    let paso = 'inicio';
    let dbElapsed = 0;
    let waElapsed = 0;
    let llmResult = null;

    try {
        // --- BD: Prospecto ---
        paso = 'prospecto';
        const tDB = Date.now();
        let prospecto = await Prospecto.findByPhone(phone);
        if (!prospecto) {
            const asesores = await Usuario.findByRol(3, id_empresa);
            const ids = asesores.map(a => a.id);
            const ultimoAsignacion = await Prospecto.findLastAsignation();
            let id_asesor = null;
            if (ids.length > 0) {
                if (ultimoAsignacion?.id_usuario) {
                    id_asesor = ids[(ids.indexOf(ultimoAsignacion.id_usuario) + 1) % ids.length];
                } else {
                    id_asesor = ids[0];
                }
            }
            prospecto = await Prospecto.create({
                id_estado_prospecto: 1, celular: phone, id_usuario: id_asesor,
                id_empresa, nombre_completo: "Stress Test", usuario_registro: 1
            });
        }

        // --- BD: Chat ---
        paso = 'chat';
        let chat = await Chat.findByProspecto(prospecto.id);
        if (!chat) {
            chat = await Chat.create({ id_prospecto: prospecto.id, usuario_registro: 1 });
        }

        // --- BD: Guardar mensaje entrante ---
        paso = 'mensaje entrante';
        const tipoMensajeBD = mapearTipoMensaje(messageType);
        await Mensaje.create({
            id_chat: chat.id,
            contenido: question || `[${tipoMensajeBD}]`,
            direccion: "in", wid_mensaje: wid, tipo_mensaje: tipoMensajeBD,
            contenido_archivo: files?.[0]?.url || null,
            fecha_hora: new Date(), usuario_registro: 1
        });
        dbElapsed = Date.now() - tDB;
        metricas.tiemposDB.push(dbElapsed);

        // --- MOCK LLM (flujo Vera) ---
        paso = 'LLM mock';
        llmResult = await mockLLM(phone, question);
        metricas.tiemposLLM.push(llmResult.latencia);
        metricas.tokensPromptTotal += llmResult.tokens_prompt;
        metricas.tokensCompletionTotal += llmResult.tokens_completion;
        metricas.tokensPerSecondSamples.push(llmResult.tokens_per_second);

        if (metricas.porPaso[llmResult.paso]) {
            metricas.porPaso[llmResult.paso].count++;
            metricas.porPaso[llmResult.paso].latencias.push(llmResult.latencia);
        }

        // --- Procesar URLs ---
        paso = 'procesar URLs';
        const { urls, textoLimpio } = procesarURLs(llmResult.respuesta);

        // --- MOCK WhatsApp ---
        paso = 'mock WA';
        const tWA = Date.now();
        if (textoLimpio) {
            const r = mockWhatsappEnviar('text', phone);
            if (r.wid_mensaje) {
                await Mensaje.create({
                    id_chat: chat.id, contenido: textoLimpio, direccion: "out",
                    wid_mensaje: r.wid_mensaje, tipo_mensaje: 'texto',
                    fecha_hora: new Date(), usuario_registro: 1
                });
            }
        }

        for (const urlInfo of urls) {
            const r = mockWhatsappEnviar(urlInfo.tipo, phone);
            if (r.wid_mensaje) {
                await Mensaje.create({
                    id_chat: chat.id, contenido: `[${urlInfo.tipo}]`, direccion: "out",
                    wid_mensaje: r.wid_mensaje, tipo_mensaje: urlInfo.tipo,
                    contenido_archivo: urlInfo.url,
                    fecha_hora: new Date(), usuario_registro: 1
                });
            }
        }
        waElapsed = Date.now() - tWA;
        metricas.tiemposWA.push(waElapsed);

        // --- Marcar contactado ---
        paso = 'marcar contactado';
        if (prospecto?.id && !prospecto.fue_contactado) {
            await Prospecto.update(prospecto.id, { fue_contactado: 1 });
        }

        const tiempoTotal = Date.now() - t0;
        metricas.exitosos++;
        metricas.tiemposTotal.push(tiempoTotal);
        metricas.registrarFinConcurrencia(tiempoTotal);
        metricasVentana.registrar(tiempoTotal, dbElapsed, llmResult.latencia, waElapsed, llmResult.paso);

        // En modo sync, responder con datos completos de timing
        if (syncMode) {
            res.status(200).json({
                status: "processed",
                paso: llmResult.paso,
                respuesta: llmResult.respuesta,
                timing: {
                    total_ms: tiempoTotal,
                    db_ms: dbElapsed,
                    llm_ms: llmResult.latencia,
                    wa_ms: waElapsed
                },
                tokens: {
                    prompt: llmResult.tokens_prompt,
                    completion: llmResult.tokens_completion,
                    per_second: llmResult.tokens_per_second
                }
            });
        }

    } catch (error) {
        const tiempoTotal = Date.now() - t0;
        metricas.errores++;
        metricas.tiemposTotal.push(tiempoTotal);
        metricas.registrarFinConcurrencia(tiempoTotal);
        logger.error(`[STRESS TEST] Error en "${paso}" | phone: ${req.body?.phone || '?'} | ${error.message}`);

        if (syncMode) {
            res.status(500).json({
                status: "error",
                paso: paso,
                error: error.message,
                timing: { total_ms: tiempoTotal }
            });
        }
    }
});

app.get('/api/stress-test/metrics', (req, res) => {
    res.json(metricas.resumen());
});

app.get('/api/stress-test/pool', (req, res) => {
    try {
        const pool = sequelize.connectionManager.pool;
        res.json({
            size: pool.size,
            available: pool.available,
            using: pool.using,
            waiting: pool.waiting,
            max: sequelize.config.pool?.max || 100,
            min: sequelize.config.pool?.min || 10,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/stress-test/reset', (req, res) => {
    metricas.reset();
    res.json({ message: "Métricas y conversaciones reseteadas" });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: 'stress-test', uptime: Math.round((Date.now() - metricas.inicio) / 1000) });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     SERVIDOR DE PRUEBAS DE ESTRÉS - VERA (VIVA)          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Endpoint:  http://localhost:${PORT}/api/stress-test/message`);
    console.log(`║  Sync:      http://localhost:${PORT}/api/stress-test/message?sync=true`);
    console.log(`║  Métricas:  http://localhost:${PORT}/api/stress-test/metrics`);
    console.log(`║  Pool BD:   http://localhost:${PORT}/api/stress-test/pool`);
    console.log(`║  Reset:     POST http://localhost:${PORT}/api/stress-test/reset`);
    console.log('║                                                            ║');
    console.log('║  Flujo Vera: Saludo → Nombre → Propósito → Distrito →     ║');
    console.log('║              Autorización → Derivación a asesor           ║');
    console.log('║                                                            ║');
    console.log('║  WhatsApp: MOCK    LLM: MOCK    BD: REAL                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
});
