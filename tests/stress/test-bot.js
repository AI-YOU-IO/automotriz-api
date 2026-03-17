import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ============================================================
// CONFIGURACIÓN
// ============================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3099';
const SYNC_MODE = __ENV.SYNC !== 'false'; // sync=true por defecto
const ENABLE_CHAOS = __ENV.CHAOS === 'true'; // chaos desactivado por defecto
const ENDPOINT = SYNC_MODE
    ? `${BASE_URL}/api/stress-test/message?sync=true`
    : `${BASE_URL}/api/stress-test/message`;
const METRICS_URL = `${BASE_URL}/api/stress-test/metrics`;
const ID_EMPRESA = __ENV.ID_EMPRESA || '1';

// ============================================================
// ESCENARIOS DE PRUEBA
// ============================================================
const scenarios = {
    funnel_inmobiliaria: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '2m', target: 20 },   // Calentamiento: 20 usuarios
            { duration: '3m', target: 40 },   // Carga media: 40 usuarios
            { duration: '3m', target: 60 },   // Carga alta: 60 usuarios
            { duration: '2m', target: 80 },   // Muy alta: 80 usuarios
            { duration: '2m', target: 100 },  // PICO: 100 usuarios
            { duration: '2m', target: 50 },   // Enfriamiento
            { duration: '1m', target: 0 },    // Cierre
        ],
        gracefulRampDown: '30s',
    },
};

// Escenario de chaos testing (opt-in con CHAOS=true)
if (ENABLE_CHAOS) {
    scenarios.chaos_testing = {
        executor: 'constant-arrival-rate',
        rate: 5,
        timeUnit: '1s',
        duration: '5m',
        preAllocatedVUs: 10,
        maxVUs: 20,
        startTime: '3m',
        exec: 'chaosTest',
    };
}

const thresholds = {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.05'],
};

// Thresholds adicionales en modo sync (métricas server-side)
if (SYNC_MODE) {
    thresholds.server_total_duration = ['p(95)<2000', 'p(99)<5000'];
    thresholds.server_db_duration = ['p(95)<1000'];
}

export const options = { scenarios, thresholds };

// ============================================================
// MÉTRICAS PERSONALIZADAS
// ============================================================
const errorRate = new Rate('errors');

// Métricas por paso del funnel (k6 http_req_duration)
const pasoSaludoDuration = new Trend('paso_saludo_duration');
const pasoNombreDuration = new Trend('paso_nombre_duration');
const pasoPropositoDuration = new Trend('paso_proposito_duration');
const pasoDistritoDuration = new Trend('paso_distrito_duration');
const pasoAutorizacionDuration = new Trend('paso_autorizacion_duration');
const pasoCompletadoDuration = new Trend('paso_completado_duration');

// Métricas server-side (extraídas del body en modo sync)
const serverTotalDuration = new Trend('server_total_duration');
const serverDbDuration = new Trend('server_db_duration');
const serverLlmDuration = new Trend('server_llm_duration');
const serverWaDuration = new Trend('server_wa_duration');

// Contadores
const conversacionesCompletadas = new Counter('conversaciones_completadas');
const mensajesTotalesEnviados = new Counter('mensajes_totales_enviados');
const chaosTotalRequests = new Counter('chaos_total_requests');
const chaosHandled = new Counter('chaos_handled');

// ============================================================
// DATOS DE PRUEBA - Simulan usuarios reales
// ============================================================
const NOMBRES = [
    'Carlos', 'María', 'Diego', 'Ana', 'Luis', 'Rosa', 'Jorge', 'Patricia',
    'Miguel', 'Carmen', 'Pedro', 'Lucía', 'Fernando', 'Sofía', 'Ricardo',
    'Valentina', 'Andrés', 'Isabella', 'Roberto', 'Camila'
];

const DISTRITOS = [
    'Miraflores', 'San Isidro', 'Surco', 'Jesús María', 'Lince',
    'San Borja', 'Barranco', 'Magdalena', 'Pueblo Libre', 'La Molina'
];

const PROPOSITOS = [
    'Estoy interesado en una vivienda propia',
    'Busco un departamento como inversión',
    'Quiero comprar un depa para mi familia',
    'Me interesa invertir en inmuebles',
    'Busco vivienda propia en una buena zona',
    'Quiero un departamento para alquilar'
];

const AUTORIZACIONES = ['Ok', 'Sí, acepto', 'Dale', 'Claro que sí', 'Acepto'];

// Keywords esperadas por paso para validación de contenido
const EXPECTED_KEYWORDS = {
    saludo:       ['Vera', 'VIVA', 'ayudar'],
    nombre:       ['proyecto', 'interesado', 'lugar'],
    proposito:    ['distrito', 'proyecto'],
    distrito:     ['autorización', 'autorices', 'datos personales', 'Acacias', 'Lirios'],
    autorizacion: ['derivando', 'compañero', 'breve'],
    completado:   ['Gracias', 'consulta', 'día'],
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function generarTelefono(vu, iter) {
    const base = 51900000000 + (vu * 100000) + (iter % 100000);
    return base.toString();
}

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Envía un mensaje y registra métricas.
 * En modo sync: valida contenido de la respuesta del bot y extrae timing server-side.
 * En modo async: solo valida status HTTP (backward compatible).
 */
function enviarMensaje(phone, question, paso, trendMetric, contexto) {
    const payload = JSON.stringify({
        phone: phone,
        question: question,
        wid: `wamid.stress_${paso}_${phone}_${Date.now()}`,
        id_empresa: ID_EMPRESA,
        messageType: 'text',
        files: [],
    });

    const params = {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
        tags: { paso: paso },
    };

    const response = http.post(ENDPOINT, payload, params);

    // Registrar latencia HTTP del paso
    if (trendMetric) {
        trendMetric.add(response.timings.duration);
    }

    mensajesTotalesEnviados.add(1);

    let success;

    if (SYNC_MODE) {
        // --- Validación completa en modo sync ---
        success = check(response, {
            [`${paso}: status 200`]: (r) => r.status === 200,
            [`${paso}: status processed`]: (r) => {
                try { return r.json().status === 'processed'; }
                catch (e) { return false; }
            },
            [`${paso}: response content valid`]: (r) => {
                try {
                    const body = r.json();
                    const keywords = EXPECTED_KEYWORDS[paso] || [];
                    const respuesta = body.respuesta || '';
                    return keywords.some(kw => respuesta.includes(kw));
                } catch (e) { return false; }
            },
            [`${paso}: timing data present`]: (r) => {
                try {
                    const t = r.json().timing;
                    return t && t.total_ms > 0 && t.db_ms >= 0 && t.llm_ms >= 0;
                } catch (e) { return false; }
            },
        });

        // Validación personalizada por paso
        if (contexto) {
            try {
                const body = response.json();
                if (paso === 'nombre' && contexto.nombre) {
                    check(response, {
                        [`${paso}: includes user name "${contexto.nombre}"`]: () =>
                            (body.respuesta || '').includes(contexto.nombre),
                    });
                }
                if (paso === 'autorizacion' && contexto.distrito) {
                    check(response, {
                        [`${paso}: includes district "${contexto.distrito}"`]: () =>
                            (body.respuesta || '').includes(contexto.distrito),
                    });
                }
            } catch (e) { /* skip personalization check on parse error */ }
        }

        // Extraer y registrar métricas server-side
        if (response.status === 200) {
            try {
                const body = response.json();
                if (body.timing) {
                    serverTotalDuration.add(body.timing.total_ms);
                    serverDbDuration.add(body.timing.db_ms);
                    serverLlmDuration.add(body.timing.llm_ms);
                    serverWaDuration.add(body.timing.wa_ms);
                }
            } catch (e) { /* skip on parse error */ }
        }
    } else {
        // --- Modo async (backward compatible) ---
        success = check(response, {
            [`${paso}: status 200`]: (r) => r.status === 200,
            [`${paso}: received`]: (r) => {
                try { return r.json().status === 'received'; }
                catch (e) { return false; }
            },
        });
    }

    errorRate.add(!success);
    return success;
}

// ============================================================
// SETUP: Resetear servidor
// ============================================================
export function setup() {
    const res = http.post(`${BASE_URL}/api/stress-test/reset`);
    if (res.status === 200) {
        console.log(`Servidor reseteado | Modo: ${SYNC_MODE ? 'SYNC (latencia real)' : 'ASYNC (fire-and-forget)'} | Chaos: ${ENABLE_CHAOS ? 'ON' : 'OFF'}`);
    } else {
        console.warn(`No se pudo resetear: status ${res.status}`);
    }
    return {};
}

// ============================================================
// FUNCIÓN PRINCIPAL
// Cada VU simula UNA conversación completa del funnel de Vera
// ============================================================
export default function () {
    const phone = generarTelefono(__VU, __ITER);
    const nombre = random(NOMBRES);
    const distrito = random(DISTRITOS);
    const contexto = { nombre, distrito };

    // -- Paso 1: Saludo --
    group('1. Saludo', () => {
        enviarMensaje(phone, 'Hola', 'saludo', pasoSaludoDuration, contexto);
    });
    sleep(Math.random() * 2 + 1); // 1-3s (usuario leyendo respuesta)

    // -- Paso 2: Dar nombre --
    group('2. Nombre', () => {
        enviarMensaje(phone, `Hola mi nombre es ${nombre}`, 'nombre', pasoNombreDuration, contexto);
    });
    sleep(Math.random() * 2 + 2); // 2-4s

    // -- Paso 3: Propósito --
    group('3. Propósito', () => {
        enviarMensaje(phone, random(PROPOSITOS), 'proposito', pasoPropositoDuration, contexto);
    });
    sleep(Math.random() * 2 + 1); // 1-3s

    // -- Paso 4: Distrito --
    group('4. Distrito', () => {
        enviarMensaje(phone, distrito, 'distrito', pasoDistritoDuration, contexto);
    });
    sleep(Math.random() * 3 + 2); // 2-5s (usuario leyendo proyectos)

    // -- Paso 5: Autorización de datos --
    group('5. Autorización', () => {
        enviarMensaje(phone, random(AUTORIZACIONES), 'autorizacion', pasoAutorizacionDuration, contexto);
    });
    sleep(Math.random() * 1 + 1); // 1-2s

    // -- Paso 6: Cierre --
    group('6. Cierre', () => {
        enviarMensaje(phone, 'Gracias, eso es todo', 'completado', pasoCompletadoDuration, contexto);
    });

    conversacionesCompletadas.add(1);

    // Pausa antes de iniciar otra conversación
    sleep(Math.random() * 3 + 2); // 2-5s
}

// ============================================================
// CHAOS TESTING - Payloads malformados y edge cases
// ============================================================
const CHAOS_PAYLOADS = [
    // Phone faltante
    { question: 'Hola', wid: 'wamid.chaos_1', id_empresa: '1', messageType: 'text' },
    // Question faltante
    { phone: '51999999999', wid: 'wamid.chaos_2', id_empresa: '1', messageType: 'text' },
    // Body vacío
    {},
    // Mensaje oversized (10KB)
    { phone: '51999999998', question: 'A'.repeat(10000), wid: 'wamid.chaos_3', id_empresa: '1', messageType: 'text' },
    // id_empresa inválido
    { phone: '51999999997', question: 'Hola', wid: 'wamid.chaos_4', id_empresa: 'abc', messageType: 'text' },
    // Phone extremadamente largo
    { phone: '9'.repeat(50), question: 'Hola', wid: 'wamid.chaos_7', id_empresa: '1', messageType: 'text' },
    // messageType inválido
    { phone: '51999999994', question: 'Hola', wid: 'wamid.chaos_8', id_empresa: '1', messageType: 'invalid_type' },
    // Caracteres especiales en question
    { phone: '51999999993', question: '🔥💀👻 émojis & spëcial <chars> "quotes"', wid: 'wamid.chaos_9', id_empresa: '1', messageType: 'text' },
    // Phone con espacios
    { phone: '  519 000 001  ', question: 'Hola', wid: 'wamid.chaos_10', id_empresa: '1', messageType: 'text' },
];

export function chaosTest() {
    const payload = CHAOS_PAYLOADS[Math.floor(Math.random() * CHAOS_PAYLOADS.length)];

    const params = {
        headers: { 'Content-Type': 'application/json' },
        timeout: '15s',
        tags: { paso: 'chaos' },
    };

    const response = http.post(ENDPOINT, JSON.stringify(payload), params);

    chaosTotalRequests.add(1);

    const handled = check(response, {
        'chaos: server responds (no crash)': (r) => r.status > 0,
        'chaos: response is valid JSON': (r) => {
            try { r.json(); return true; }
            catch (e) { return false; }
        },
        'chaos: no unhandled 5xx': (r) => r.status < 500,
    });

    if (handled) chaosHandled.add(1);
}

// ============================================================
// TEARDOWN: Mostrar métricas del servidor
// ============================================================
export function teardown() {
    sleep(3);

    const res = http.get(METRICS_URL);
    if (res.status !== 200) return;

    const m = res.json();

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║          RESULTADOS DEL SERVIDOR (procesamiento real)       ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    console.log('║                                                              ║');
    console.log(`║  MODO: ${SYNC_MODE ? 'SYNC (k6 mide latencia real)' : 'ASYNC (k6 mide solo HTTP)'}`);

    console.log('║                                                              ║');
    console.log('║  RESUMEN GENERAL                                            ║');
    console.log(`║    Requests totales:    ${m.resumen_general.totalRequests}`);
    console.log(`║    Exitosos:            ${m.resumen_general.exitosos}`);
    console.log(`║    Errores:             ${m.resumen_general.errores} (${m.resumen_general.tasaError})`);
    console.log(`║    Req/s:               ${m.resumen_general.requestsPorSegundo}`);

    console.log('║                                                              ║');
    console.log('║  LATENCIA DE INFERENCIA (tiempo total de respuesta)          ║');
    console.log(`║    avg: ${m.latencia_inferencia.avg}ms | p50: ${m.latencia_inferencia.p50}ms | p95: ${m.latencia_inferencia.p95}ms | p99: ${m.latencia_inferencia.p99}ms`);

    console.log('║                                                              ║');
    console.log('║  RENDIMIENTO DE TOKENS                                      ║');
    console.log(`║    Tokens prompt:       ${m.rendimiento_tokens.tokens_prompt_total}`);
    console.log(`║    Tokens completion:   ${m.rendimiento_tokens.tokens_completion_total}`);
    console.log(`║    Tokens/segundo avg:  ${m.rendimiento_tokens.tokens_por_segundo_avg}`);

    console.log('║                                                              ║');
    console.log('║  ESTABILIDAD DE CONCURRENCIA                                ║');
    console.log(`║    Max concurrentes:    ${m.estabilidad_concurrencia.concurrencia_maxima}`);
    console.log(`║    Evaluación:          ${m.estabilidad_concurrencia.evaluacion}`);

    console.log('║                                                              ║');
    console.log('║  LATENCIA DE DEPENDENCIAS                                   ║');
    console.log(`║    BD:     avg ${m.latencia_dependencias.base_datos.avg}ms | p95 ${m.latencia_dependencias.base_datos.p95}ms | p99 ${m.latencia_dependencias.base_datos.p99}ms`);
    console.log(`║    LLM:    avg ${m.latencia_dependencias.llm_mock.avg}ms | p95 ${m.latencia_dependencias.llm_mock.p95}ms`);
    console.log(`║    WA:     avg ${m.latencia_dependencias.whatsapp_mock.avg}ms | p95 ${m.latencia_dependencias.whatsapp_mock.p95}ms`);

    // Pool de conexiones BD
    if (m.pool_conexiones && !m.pool_conexiones.error) {
        console.log('║                                                              ║');
        console.log('║  POOL DE CONEXIONES BD                                      ║');
        console.log(`║    Size: ${m.pool_conexiones.size} | Using: ${m.pool_conexiones.using} | Available: ${m.pool_conexiones.available} | Waiting: ${m.pool_conexiones.waiting}`);
        console.log(`║    Config: min=${m.pool_conexiones.min} max=${m.pool_conexiones.max}`);
    }

    // Ventana últimos 60s
    if (m.ventana_60s) {
        console.log('║                                                              ║');
        console.log('║  VENTANA ULTIMOS 60s (tendencia final)                      ║');
        console.log(`║    RPS: ${m.ventana_60s.rps} | count: ${m.ventana_60s.count}`);
        console.log(`║    Total:  avg ${m.ventana_60s.total.avg}ms | p95 ${m.ventana_60s.total.p95}ms | p99 ${m.ventana_60s.total.p99}ms`);
        console.log(`║    BD:     avg ${m.ventana_60s.db.avg}ms | p95 ${m.ventana_60s.db.p95}ms`);
        console.log(`║    LLM:    avg ${m.ventana_60s.llm.avg}ms | p95 ${m.ventana_60s.llm.p95}ms`);
    }

    console.log('║                                                              ║');
    console.log('║  FUNNEL CONVERSACIONAL (Vera)                               ║');
    for (const [paso, data] of Object.entries(m.funnel_conversacional)) {
        if (data.count > 0) {
            console.log(`║    ${paso}: ${data.count} msgs | avg ${data.latencia.avg}ms | p95 ${data.latencia.p95}ms`);
        }
    }

    console.log(`║                                                              ║`);
    console.log(`║  Conversaciones activas: ${m.conversaciones_activas}`);
    console.log(`║  Mensajes WA simulados:  ${m.mensajes_wa_simulados}`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ============================================================
// RESUMEN FINAL
// ============================================================
export function handleSummary(data) {
    const now = new Date().toISOString().replace(/[:.]/g, '-');

    return {
        stdout: textSummary(data, { indent: '  ', enableColors: true }),
        [`./results/stress-test-${now}.json`]: JSON.stringify(data, null, 2),
    };
}
