/**
 * Interfaz abstracta para proveedores de LLM.
 * Todos los proveedores (OpenAI, Ollama, vLLM) deben extender esta clase.
 *
 * Formato de respuesta (LlmResponse):
 * {
 *   content: string|null,
 *   tool_calls: Array<{id, function: {name, arguments}}>|null,
 *   usage: { input_tokens: number, output_tokens: number },
 *   model: string
 * }
 */
class LlmProviderInterface {

    /**
     * Envia una solicitud de chat completion con historial y tools opcionales.
     * @param {Object} params
     * @param {string} params.systemPrompt - Instrucciones del sistema
     * @param {Array<{role: string, content: string}>} params.messages - Historial de conversacion
     * @param {string} params.model - Identificador del modelo
     * @param {number} params.temperature - Temperatura de sampling
     * @param {Array|undefined} params.tools - Definiciones de tools (formato OpenAI)
     * @returns {Promise<LlmResponse>}
     */
    async chat({ systemPrompt, messages, model, temperature, tools }) {
        throw new Error("chat() debe ser implementado por el provider");
    }
}

module.exports = LlmProviderInterface;
