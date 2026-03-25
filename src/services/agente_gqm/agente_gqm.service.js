const axios = require('axios');

class AgenteGQMService {
    
    constructor() {
        this.baseURL = 'https://maravia-agente-gqm.dvmssk.easypanel.host/api/chat';
    }

    async enviarMensaje({ id_empresa, phone_number_id, phone, question, id_chat }) {
        try {
            const response = await axios.post(this.baseURL, {
                id_empresa,
                phone_number_id,
                phone,
                question,
                id_chat
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            return response.data;
        } catch (error) {
            console.error(`[AgenteGQMService] Error enviando mensaje: ${error.message}`);
            throw error;
        }
    }
}
module.exports = new AgenteGQMService();