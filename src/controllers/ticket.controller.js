const ticketService = require('../services/ticket/ticket.service.js');
const logger = require('../config/logger/loggerClient.js');

class TicketController {

    async getCatalogos(req, res) {
        try {
            const result = await ticketService.getCatalogos();
            return res.status(200).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al obtener catalogos: ${error.message}`);
            return res.status(500).json({ msg: "Error al obtener catalogos" });
        }
    }

    async getAll(req, res) {
        try {
            const { userId, idEmpresa } = req.user;
            const { estado, prioridad, categoria, search, page = 1, limit = 20 } = req.query;

            const result = await ticketService.getAll({
                idEmpresa,
                usuarioExternoId: userId,
                estado, prioridad, categoria, search,
                page: parseInt(page), limit: parseInt(limit)
            });

            return res.status(200).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al obtener tickets: ${error.message}`);
            return res.status(500).json({ msg: "Error al obtener tickets" });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const result = await ticketService.getById(id);
            return res.status(200).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al obtener ticket: ${error.message}`);
            return res.status(error.response?.status || 500).json({ msg: error.response?.data?.msg || "Error al obtener ticket" });
        }
    }

    async create(req, res) {
        try {
            const { userId, username, idEmpresa } = req.user;
            const { asunto, descripcion, id_categoria_soporte, id_prioridad_ticket } = req.body;

            if (!asunto || !descripcion || !id_categoria_soporte || !id_prioridad_ticket) {
                return res.status(400).json({ msg: "Los campos asunto, descripcion, categoria y prioridad son requeridos" });
            }

            const result = await ticketService.create({
                asunto, descripcion, id_categoria_soporte, id_prioridad_ticket,
                id_empresa: idEmpresa,
                usuario_externo_id: userId,
                usuario_externo_nombre: username
            });

            return res.status(201).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al crear ticket: ${error.message}`);
            return res.status(500).json({ msg: "Error al crear ticket" });
        }
    }

    async getComentarios(req, res) {
        try {
            const { id } = req.params;
            const result = await ticketService.getComentarios(id);
            return res.status(200).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al obtener comentarios: ${error.message}`);
            return res.status(500).json({ msg: "Error al obtener comentarios" });
        }
    }

    async createComentario(req, res) {
        try {
            const { id } = req.params;
            const { userId, username } = req.user;
            const { contenido } = req.body;

            if (!contenido && (!req.files || req.files.length === 0)) {
                return res.status(400).json({ msg: "Debe proporcionar contenido o archivos adjuntos" });
            }

            const result = await ticketService.createComentario(id, {
                contenido: contenido || '',
                usuario_externo_id: userId,
                usuario_externo_nombre: username,
                files: req.files || []
            });

            return res.status(201).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al crear comentario: ${error.message}`);
            return res.status(500).json({ msg: "Error al crear comentario" });
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const result = await ticketService.markAsRead(id, userId);
            return res.status(200).json(result);
        } catch (error) {
            logger.error(`[ticket.controller.js] Error al marcar como leido: ${error.message}`);
            return res.status(500).json({ msg: "Error al marcar como leido" });
        }
    }
}

module.exports = new TicketController();
