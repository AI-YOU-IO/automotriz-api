const axios = require('axios');
const logger = require('../../config/logger/loggerClient.js');

const TICKET_API_URL = process.env.TICKET_API_URL;
const TICKET_API_KEY = process.env.TICKET_API_KEY;
const ID_PLATAFORMA = 3; // automotriz

class TicketService {

    constructor() {
        this.client = axios.create({
            baseURL: TICKET_API_URL,
            timeout: 30000,
            headers: { 'X-API-Key': TICKET_API_KEY, 'Content-Type': 'application/json' }
        });
    }

    async getCatalogos() {
        const response = await this.client.get('/catalogos');
        return response.data;
    }

    async getAll({ idEmpresa, usuarioExternoId, estado, prioridad, categoria, search, page, limit }) {
        const params = { id_empresa: idEmpresa, usuario_externo_id: usuarioExternoId, estado, prioridad, categoria, search, page, limit };
        Object.keys(params).forEach(k => { if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k]; });
        const response = await this.client.get('/tickets', { params });
        return response.data;
    }

    async getById(id) {
        const response = await this.client.get(`/tickets/${id}`);
        return response.data;
    }

    async create({ asunto, descripcion, id_categoria_soporte, id_prioridad_ticket, id_empresa, usuario_externo_id, usuario_externo_nombre }) {
        const response = await this.client.post('/tickets', {
            asunto, descripcion, id_categoria_soporte, id_prioridad_ticket,
            id_empresa, id_plataforma: ID_PLATAFORMA,
            usuario_externo_id, usuario_externo_nombre
        });
        return response.data;
    }

    async getComentarios(id) {
        const response = await this.client.get(`/tickets/${id}/comentarios`);
        return response.data;
    }

    async createComentario(id, { contenido, usuario_externo_id, usuario_externo_nombre, files }) {
        const FormData = require('form-data');
        const formData = new FormData();
        if (contenido) formData.append('contenido', contenido);
        formData.append('usuario_externo_id', usuario_externo_id);
        formData.append('usuario_externo_nombre', usuario_externo_nombre);
        if (files && files.length > 0) {
            for (const file of files) {
                formData.append('archivos', file.buffer, { filename: file.originalname, contentType: file.mimetype });
            }
        }
        const response = await this.client.post(`/tickets/${id}/comentarios`, formData, {
            headers: { ...formData.getHeaders(), 'X-API-Key': TICKET_API_KEY },
            timeout: 60000
        });
        return response.data;
    }

    async markAsRead(id, usuario_externo_id) {
        const response = await this.client.post(`/tickets/${id}/mark-read`, { usuario_externo_id });
        return response.data;
    }
}

module.exports = new TicketService();
