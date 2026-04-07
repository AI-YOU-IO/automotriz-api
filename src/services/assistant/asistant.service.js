const path = require("path");
const { createLlmProvider } = require("../llm");
const MemoryService = require("./memory.service");
const { buildSystemPrompt } = require("./promptCache.service");
const ToolExecutor = require("./tools/toolExecutor");
const { getLocalDateWithDay } = require("../../utils/customTimestamp");
const { Empresa, Tool } = require("../../models/sequelize");
const logger = require("../../config/logger/loggerClient");

const MAX_TOOL_ITERATIONS = 15;
const MAX_TOOL_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Cache de toolDefinitions por empresa
const _toolDefinitionsCache = new Map();

/**
 * Carga las definiciones de tools según el id_tool_chatbot de la empresa
 * @param {number} id_empresa
 * @returns {Promise<Array>} toolDefinitions
 */
async function loadToolDefinitions(id_empresa) {
    // Verificar cache
    if (_toolDefinitionsCache.has(id_empresa)) {
        return _toolDefinitionsCache.get(id_empresa);
    }

    try {
        // Obtener empresa con su id_tool_chatbot
        const empresa = await Empresa.findByPk(id_empresa, {
            attributes: ['id', 'id_tool_chatbot']
        });

        if (!empresa || !empresa.id_tool_chatbot) {
            logger.warn(`[AssistantService] Empresa ${id_empresa} no tiene id_tool_chatbot configurado, usando toolGenerica`);
            const { toolDefinitions } = require("./tools/toolGenerica");
            _toolDefinitionsCache.set(id_empresa, toolDefinitions);
            return toolDefinitions;
        }

        // Obtener el tool
        const tool = await Tool.findByPk(empresa.id_tool_chatbot, {
            attributes: ['id', 'nombre', 'ruta']
        });

        if (!tool || !tool.ruta) {
            logger.warn(`[AssistantService] Tool ${empresa.id_tool_chatbot} no encontrado o sin ruta, usando toolGenerica`);
            const { toolDefinitions } = require("./tools/toolGenerica");
            _toolDefinitionsCache.set(id_empresa, toolDefinitions);
            return toolDefinitions;
        }

        // Cargar el módulo del tool dinámicamente
        const toolPath = path.resolve(__dirname, "tools", tool.ruta);

        // Limpiar cache de require para obtener versión actualizada
        delete require.cache[require.resolve(toolPath)];
        const toolModule = require(toolPath);

        const definitions = toolModule.toolDefinitions || [];
        _toolDefinitionsCache.set(id_empresa, definitions);
        logger.info(`[AssistantService] Tool '${tool.nombre}' cargado para empresa ${id_empresa} con ${definitions.length} funciones`);

        return definitions;
    } catch (error) {
        logger.error(`[AssistantService] Error al cargar toolDefinitions: ${error.message}`);
        // Fallback a toolGenerica
        const { toolDefinitions } = require("./tools/toolGenerica");
        return toolDefinitions;
    }
}

/**
 * Invalida el cache de toolDefinitions para una empresa
 * @param {number} id_empresa - Si es null, invalida todo el cache
 */
function invalidateToolDefinitionsCache(id_empresa) {
    if (id_empresa) {
        _toolDefinitionsCache.delete(id_empresa);
    } else {
        _toolDefinitionsCache.clear();
    }
}

class AssistantService {

    constructor() {
        this.llmProvider = createLlmProvider();
        this.model = process.env.LLM_MODEL || "gpt-4.1";
        this.temperature = Number(process.env.LLM_TEMPERATURE) || 0.2;
    }

    /**
     * Procesa un mensaje del usuario a traves del LLM con loop de tool calling.
     * @param {Object} params
     * @param {number} params.chatId - ID del chat para historial
     * @param {string} params.message - Mensaje actual del usuario
     * @param {Object} params.prospecto - Registro del prospecto desde DB
     * @param {number} params.id_empresa - ID de la empresa
     * @returns {Promise<string>} - Respuesta de texto del LLM
     */
    async runProcess({ chatId, message, prospecto, id_empresa }) {
        try {
            // Cargar tools dinámicamente según la empresa
            const toolDefinitions = await loadToolDefinitions(id_empresa);

            const systemPrompt = await buildSystemPrompt({
                prospecto,
                timestamp: getLocalDateWithDay(),
                id_empresa
            });

            const history = await MemoryService.getConversationHistory(chatId);

            const messages = [
                ...history,
                { role: "user", content: message }
            ];

            const toolExecutor = new ToolExecutor({
                id_empresa,
                prospecto_id: prospecto.id
            });

            const newMessages = [{ role: "user", content: message }];

            let iterations = 0;

            while (iterations < MAX_TOOL_ITERATIONS) {
                iterations++;

                const response = await this.llmProvider.chat({
                    systemPrompt,
                    messages,
                    model: this.model,
                    temperature: this.temperature,
                    tools: toolDefinitions
                });

                if (!response.tool_calls || response.tool_calls.length === 0) {
                    newMessages.push({ role: "assistant", content: response.content });
                    await MemoryService.addMessagesToCache(chatId, newMessages);
                    return response.content;
                }

                const assistantMsg = {
                    role: "assistant",
                    content: response.content,
                    tool_calls: response.tool_calls
                };
                messages.push(assistantMsg);
                newMessages.push(assistantMsg);

                for (const toolCall of response.tool_calls) {
                    let result;
                    const args = JSON.parse(toolCall.function.arguments);

                    for (let attempt = 1; attempt <= MAX_TOOL_RETRIES + 1; attempt++) {
                        try {
                            result = await toolExecutor.execute(toolCall.function.name, args);
                            logger.info(`[AssistantService] Tool: ${toolCall.function.name}, args: ${toolCall.function.arguments}, result: ${result}`);
                            break;
                        } catch (toolError) {
                            logger.error(`[AssistantService] Error en tool ${toolCall.function.name} (intento ${attempt}/${MAX_TOOL_RETRIES + 1}): ${toolError.message}`);
                            if (attempt <= MAX_TOOL_RETRIES) {
                                await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
                            } else {
                                result = JSON.stringify({ error: `Error al ejecutar ${toolCall.function.name}: ${toolError.message}` });
                            }
                        }
                    }

                    const toolMsg = {
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: result
                    };
                    messages.push(toolMsg);
                    newMessages.push(toolMsg);
                }
            }

            logger.warn(`[AssistantService] Max tool iterations (${MAX_TOOL_ITERATIONS}) alcanzado, forzando respuesta de texto`);
            const finalResponse = await this.llmProvider.chat({
                systemPrompt,
                messages,
                model: this.model,
                temperature: this.temperature,
                tools: undefined
            });

            newMessages.push({ role: "assistant", content: finalResponse.content });
            await MemoryService.addMessagesToCache(chatId, newMessages);
            return finalResponse.content;

        } catch (error) {
            logger.error(`[AssistantService.runProcess] ${error.message}`);
            throw error;
        }
    }
}

const assistantService = new AssistantService();

module.exports = {
    ...assistantService,
    runProcess: assistantService.runProcess.bind(assistantService),
    invalidateToolDefinitionsCache
};
