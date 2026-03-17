const recursoRepository = require("../repositories/recurso.repository.js");
const logger = require('../config/logger/loggerClient.js');
const s3Service = require('../services/s3.service.js');
const path = require('path');

class RecursoController {
  async getRecursos(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const recursos = await recursoRepository.findAll(idEmpresa);
      return res.status(200).json({ data: recursos });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al obtener recursos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener recursos" });
    }
  }

  async getRecursoById(req, res) {
    try {
      const { id } = req.params;
      const recurso = await recursoRepository.findById(id);

      if (!recurso) {
        return res.status(404).json({ msg: "Recurso no encontrado" });
      }

      return res.status(200).json({ data: recurso });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al obtener recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener recurso" });
    }
  }

  async uploadRecurso(req, res) {
    try {
      console.log('=== UPLOAD REQUEST ===');
      console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size, mime: req.file.mimetype } : 'No file');
      console.log('User:', req.user);

      if (!req.file) {
        return res.status(400).json({ msg: "No se recibió ningún archivo" });
      }

      // Obtener id_empresa del usuario autenticado o del body
      const idEmpresa = req.user?.idEmpresa || req.body.id_empresa || null;
      // Obtener tipo de recurso del body
      const tipoRecurso = req.body.tipo_recurso || 'otros';
      console.log('Using idEmpresa:', idEmpresa, 'tipoRecurso:', tipoRecurso);

      // Generar nombre único para el archivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const filename = uniqueSuffix + ext;

      // Subir a S3
      const { url, key } = await s3Service.uploadFile(
        req.file.buffer,
        filename,
        req.file.mimetype,
        idEmpresa,
        tipoRecurso
      );

      return res.status(200).json({ data: { url, key } });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al subir archivo a S3: ${error.message}`);
      return res.status(500).json({ msg: "Error al subir archivo" });
    }
  }

  async createRecurso(req, res) {
    try {
      const { nombre, url, tipo_recurso_id } = req.body;
      const id_proyecto = req.body.id_proyecto ?? null;
      const id_tipologia = req.body.id_tipologia ?? null;
      const empresa_id = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      if (!tipo_recurso_id) {
        return res.status(400).json({ msg: "El tipo de recurso es requerido" });
      }

      const recurso = await recursoRepository.create({
        nombre, url, tipo_recurso_id, id_proyecto, id_tipologia, empresa_id,
        usuario_registro, usuario_actualizacion: usuario_registro
      });

      return res.status(201).json({ msg: "Recurso creado exitosamente", data: { id: recurso.id } });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al crear recurso: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear recurso" });
    }
  }

  async updateRecurso(req, res) {
    try {
      const { id } = req.params;
      const { nombre, url, tipo_recurso_id } = req.body;
      const id_proyecto = req.body.id_proyecto ?? null;
      const id_tipologia = req.body.id_tipologia ?? null;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await recursoRepository.update(id, {
        nombre, url, tipo_recurso_id, id_proyecto, id_tipologia, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Recurso no encontrado" });
      }

      return res.status(200).json({ msg: "Recurso actualizado exitosamente" });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al actualizar recurso: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar recurso" });
    }
  }

  async deleteRecurso(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await recursoRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Recurso no encontrado" });
      }

      return res.status(200).json({ msg: "Recurso eliminado exitosamente" });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al eliminar recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar recurso" });
    }
  }
}

module.exports = new RecursoController();
