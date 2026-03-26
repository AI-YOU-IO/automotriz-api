const axios = require('axios');
const { logger } = require('sequelize/lib/utils/logger');

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

            logger.info(`[AgenteGQMService] Mensaje enviado exitosamente a GQM para phone: ${phone}, id_chat: ${id_chat}`);
            return response.data;
        } catch (error) {
            console.error(`[AgenteGQMService] Error enviando mensaje: ${error.message}`);
            throw error;
        }
    }
}
module.exports = new AgenteGQMService();