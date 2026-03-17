const { OpenAI } = require("openai");
const LlmProviderInterface = require("./llmProvider.interface");

class OpenAIChatProvider extends LlmProviderInterface {

    constructor({ apiKey, baseURL }) {
        super();
        this.client = new OpenAI({
            apiKey,
            ...(baseURL && { baseURL })
        });
    }

    async chat({ systemPrompt, messages, model, temperature, tools }) {
        const fullMessages = [
            { role: "system", content: systemPrompt },
            ...messages
        ];

        const params = {
            model,
            messages: fullMessages,
            temperature,
            ...(tools && tools.length > 0 && { tools, tool_choice: "auto" })
        };

        const response = await this.client.chat.completions.create(params);
        const choice = response.choices[0];

        return {
            content: choice.message.content,
            tool_calls: choice.message.tool_calls || null,
            usage: {
                input_tokens: response.usage?.prompt_tokens || 0,
                output_tokens: response.usage?.completion_tokens || 0
            },
            model: response.model
        };
    }
}

module.exports = OpenAIChatProvider;
