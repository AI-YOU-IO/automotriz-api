const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger/loggerClient");

let _cachedPromptTemplate = null;

function loadPromptTemplate() {
    if (_cachedPromptTemplate) return _cachedPromptTemplate;

    const filePath = path.join(__dirname, "prompts", "viva.md");
    _cachedPromptTemplate = fs.readFileSync(filePath, "utf-8");
    logger.info("[promptCache] System prompt cargado y cacheado en memoria");
    return _cachedPromptTemplate;
}

function buildSystemPrompt({ prospecto, timestamp }) {
    const template = loadPromptTemplate();

    const prospectoData = prospecto.toJSON ? prospecto.toJSON() : { ...prospecto };

    // Aplanar datos de la última interacción con proyecto
    const ultimaInteraccion = prospectoData.interacciones?.[0];
    if (ultimaInteraccion?.proyecto) {
        prospectoData.id_proyecto = ultimaInteraccion.proyecto.id;
        prospectoData.nombre_proyecto = ultimaInteraccion.proyecto.nombre;
    } else {
        prospectoData.id_proyecto = null;
        prospectoData.nombre_proyecto = null;
    }
    delete prospectoData.interacciones;

    // logger.info(`[promptCache] Prospeto data: ${JSON.stringify(prospectoData)}`);

    return template
        .replace("{{datos}}", JSON.stringify(prospectoData))
        .replace("{{timestamp}}", timestamp);
}

module.exports = { loadPromptTemplate, buildSystemPrompt };
