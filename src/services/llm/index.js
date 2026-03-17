const OpenAIChatProvider = require("./openaiChat.provider");

function createLlmProvider() {
    const provider = process.env.LLM_PROVIDER || "openai";

    switch (provider) {
        case "openai":
            return new OpenAIChatProvider({
                apiKey: process.env.OPENAI_API_KEY,
                baseURL: process.env.OPENAI_BASE_URL || undefined
            });
        case "local":
            return new OpenAIChatProvider({
                apiKey: process.env.LOCAL_LLM_API_KEY || "not-needed",
                baseURL: process.env.LOCAL_LLM_BASE_URL || "http://localhost:11434/v1"
            });
        default:
            throw new Error(`Proveedor LLM desconocido: ${provider}`);
    }
}

module.exports = { createLlmProvider };
