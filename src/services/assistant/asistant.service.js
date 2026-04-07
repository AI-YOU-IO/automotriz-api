const { createLlmProvider } = require("../llm");
const MemoryService = require("./memory.service");
const { buildSystemPrompt } = require("./promptCache.service");
const { toolDefinitions } = require("./tools/toolGenerica");
const ToolExecutor = require("./tools/toolExecutor");
const { getLocalDateWithDay } = require("../../utils/customTimestamp");
const logger = require("../../config/logger/loggerClient");

const MAX_TOOL_ITERATIONS = 15;
const MAX_TOOL_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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

module.exports = new AssistantService();
