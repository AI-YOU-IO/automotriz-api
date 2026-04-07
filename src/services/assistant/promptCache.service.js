const logger = require("../../config/logger/loggerClient");
const { PromptAsistente, Marca, Modelo, Version, Faq, sequelize } = require("../../models/sequelize");

// Cache por id_empresa
const _promptCache = new Map();
const _autosCache = new Map();
const _faqsCache = new Map();
const _preguntasPerfilamientoCache = new Map();

// Función para obtener fecha/hora formateadas
function getDateTimeValues() {
    const now = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    return {
        fecha_completa: `${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`,
        hora_actual: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
        fecha_iso: now.toISOString().split('T')[0]
    };
}

// Cargar y formatear autos (marcas > modelos > versiones)
async function loadAutosData(id_empresa) {
    if (_autosCache.has(id_empresa)) {
        return _autosCache.get(id_empresa);
    }

    try {
        const marcas = await Marca.findAll({
            where: { id_empresa, estado_registro: 1 },
            include: [{
                model: Modelo,
                as: 'modelos',
                where: { estado_registro: 1 },
                required: false,
                include: [{
                    model: Version,
                    as: 'versiones',
                    where: { estado_registro: 1 },
                    required: false
                }]
            }],
            order: [['nombre', 'ASC']]
        });

        const formatted = marcas.map(marca => {
            const modelos = (marca.modelos || []).map(modelo => {
                const versiones = (modelo.versiones || []).map(v => `${v.nombre} (id: ${v.id})`).join(', ');
                return `  - ${modelo.nombre} (id: ${modelo.id})${versiones ? `: ${versiones}` : ''}`;
            }).join('\n');
            return `${marca.nombre} (id: ${marca.id})\n${modelos}`;
        }).join('\n\n');

        const result = formatted || 'No hay autos configurados';
        _autosCache.set(id_empresa, result);
        return result;
    } catch (error) {
        logger.error(`[promptCache] Error al cargar autos: ${error.message}`);
        return 'Error al cargar autos';
    }
}

// Cargar y formatear FAQs
async function loadFaqsData(id_empresa) {
    if (_faqsCache.has(id_empresa)) {
        return _faqsCache.get(id_empresa);
    }

    try {
        const faqs = await Faq.findAll({
            where: { id_empresa, estado_registro: 1 },
            order: [['id', 'ASC']]
        });

        const formatted = faqs.map((faq, idx) =>
            `${idx + 1}. P: ${faq.pregunta}\n   R: ${faq.respuesta}`
        ).join('\n\n');

        const result = formatted || 'No hay FAQs configuradas';
        _faqsCache.set(id_empresa, result);
        return result;
    } catch (error) {
        logger.error(`[promptCache] Error al cargar FAQs: ${error.message}`);
        return 'Error al cargar FAQs';
    }
}

// Cargar y formatear preguntas de perfilamiento
async function loadPreguntasPerfilamientoData(id_empresa) {
    if (_preguntasPerfilamientoCache.has(id_empresa)) {
        return _preguntasPerfilamientoCache.get(id_empresa);
    }

    try {
        const [preguntas] = await sequelize.query(`
            SELECT pregunta FROM pregunta_perfilamiento
            WHERE id_empresa = :id_empresa AND estado_registro = 1
            ORDER BY orden ASC
        `, {
            replacements: { id_empresa },
            type: sequelize.QueryTypes.SELECT
        });

        if (!preguntas || preguntas.length === 0) {
            _preguntasPerfilamientoCache.set(id_empresa, 'No hay preguntas de perfilamiento configuradas');
            return 'No hay preguntas de perfilamiento configuradas';
        }

        const formatted = preguntas.map((p, idx) => `${idx + 1}. ${p.pregunta}`).join('\n');
        _preguntasPerfilamientoCache.set(id_empresa, formatted);
        return formatted;
    } catch (error) {
        logger.error(`[promptCache] Error al cargar preguntas de perfilamiento: ${error.message}`);
        return 'No hay preguntas de perfilamiento configuradas';
    }
}

async function loadPromptTemplate(id_empresa) {
    // Verificar cache
    if (_promptCache.has(id_empresa)) {
        return _promptCache.get(id_empresa);
    }

    // Cargar desde la base de datos
    const prompt = await PromptAsistente.findOne({
        where: { id_empresa, estado_registro: 1 },
        attributes: ['prompt_sistema']
    });

    if (!prompt || !prompt.prompt_sistema) {
        logger.warn(`[promptCache] No se encontró prompt para empresa ${id_empresa}`);
        return null;
    }

    // Cachear y retornar
    _promptCache.set(id_empresa, prompt.prompt_sistema);
    logger.info(`[promptCache] System prompt cargado y cacheado para empresa ${id_empresa}`);
    return prompt.prompt_sistema;
}

// Función para invalidar cache cuando se actualiza el prompt
function invalidateCache(id_empresa) {
    if (id_empresa) {
        _promptCache.delete(id_empresa);
        _autosCache.delete(id_empresa);
        _faqsCache.delete(id_empresa);
        _preguntasPerfilamientoCache.delete(id_empresa);
        logger.info(`[promptCache] Cache invalidado para empresa ${id_empresa}`);
    } else {
        _promptCache.clear();
        _autosCache.clear();
        _faqsCache.clear();
        _preguntasPerfilamientoCache.clear();
        logger.info("[promptCache] Cache completo invalidado");
    }
}

// Función para invalidar solo cache de autos
function invalidateAutosCache(id_empresa) {
    if (id_empresa) {
        _autosCache.delete(id_empresa);
    } else {
        _autosCache.clear();
    }
}

// Función para invalidar solo cache de FAQs
function invalidateFaqsCache(id_empresa) {
    if (id_empresa) {
        _faqsCache.delete(id_empresa);
    } else {
        _faqsCache.clear();
    }
}

async function buildSystemPrompt({ prospecto, timestamp, id_empresa }) {
    const template = await loadPromptTemplate(id_empresa);

    if (!template) {
        throw new Error(`No hay prompt configurado para la empresa ${id_empresa}`);
    }

    const prospectoData = prospecto.toJSON ? prospecto.toJSON() : { ...prospecto };

    // Aplanar datos de la última interacción con marca
    const ultimaInteraccion = prospectoData.interacciones?.[0];
    if (ultimaInteraccion?.marca) {
        prospectoData.id_marca = ultimaInteraccion.marca.id;
        prospectoData.nombre_marca = ultimaInteraccion.marca.nombre;
    } else {
        prospectoData.id_marca = null;
        prospectoData.nombre_marca = null;
    }
    delete prospectoData.interacciones;

    // Cargar datos de placeholders en paralelo
    const [autosData, faqsData, preguntasData] = await Promise.all([
        loadAutosData(id_empresa),
        loadFaqsData(id_empresa),
        loadPreguntasPerfilamientoData(id_empresa)
    ]);

    // Obtener fecha/hora actuales
    const dateTimeValues = getDateTimeValues();

    // Reemplazar todos los placeholders
    let result = template
        .replace(/\{\{\s*datos\s*\}\}/g, JSON.stringify(prospectoData))
        .replace(/\{\{\s*timestamp\s*\}\}/g, timestamp)
        .replace(/\{\{\s*autos\s*\}\}/g, autosData)
        .replace(/\{\{\s*faqs\s*\}\}/g, faqsData)
        .replace(/\{\{\s*preguntas_perfilamiento\s*\}\}/g, preguntasData)
        .replace(/\{\{\s*fecha_completa\s*\}\}/g, dateTimeValues.fecha_completa)
        .replace(/\{\{\s*hora_actual\s*\}\}/g, dateTimeValues.hora_actual)
        .replace(/\{\{\s*fecha_iso\s*\}\}/g, dateTimeValues.fecha_iso);

    return result;
}

module.exports = {
    loadPromptTemplate,
    buildSystemPrompt,
    invalidateCache,
    invalidateAutosCache,
    invalidateFaqsCache
};
