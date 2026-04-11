const recursoRepository = require("../repositories/recurso.repository.js");
const logger = require('../config/logger/loggerClient.js');
const s3Service = require('../services/s3.service.js');
const path = require('path');

const detectTipoRecurso = (mimetype) => {
  if (mimetype.startsWith('image/')) return { id: 2, nombre: 'imagen' };
  if (mimetype.startsWith('video/')) return { id: 1, nombre: 'video' };
  if (mimetype === 'application/pdf') return { id: 3, nombre: 'pdf' };
  return { id: 4, nombre: 'documento' };
};

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
      if (!req.file) {
        return res.status(400).json({ msg: "No se recibió ningún archivo" });
      }

      const idEmpresa = req.user?.idEmpresa || req.body.id_empresa || null;
      const tipo = detectTipoRecurso(req.file.mimetype);
      const tipoRecurso = req.body.tipo_recurso || tipo.nombre;

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const filename = uniqueSuffix + ext;

      const { url, key } = await s3Service.uploadFile(
        req.file.buffer, filename, req.file.mimetype, idEmpresa, tipoRecurso
      );

      return res.status(200).json({
        data: { url, key, mimetype: req.file.mimetype, originalname: req.file.originalname, id_tipo_recurso: tipo.id, tipo_nombre: tipo.nombre }
      });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al subir archivo a S3: ${error.message}`);
      return res.status(500).json({ msg: "Error al subir archivo" });
    }
  }

  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: "No se recibieron archivos" });
      }

      const idEmpresa = req.user?.idEmpresa || req.body.id_empresa || null;
      const results = [];

      for (const file of req.files) {
        const tipo = detectTipoRecurso(file.mimetype);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = uniqueSuffix + ext;

        const { url, key } = await s3Service.uploadFile(
          file.buffer, filename, file.mimetype, idEmpresa, tipo.nombre
        );

        results.push({
          url, key,
          mimetype: file.mimetype,
          originalname: file.originalname,
          id_tipo_recurso: tipo.id,
          tipo_nombre: tipo.nombre
        });
      }

      return res.status(200).json({ data: results });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al subir archivos: ${error.message}`);
      return res.status(500).json({ msg: "Error al subir archivos" });
    }
  }

  async createRecurso(req, res) {
    try {
      const { nombre, url, id_tipo_recurso } = req.body;
      const id_modelo = req.body.id_modelo ?? null;
      const es_principal = req.body.es_principal ?? 0;
      const orden = req.body.orden ?? 0;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      if (!id_tipo_recurso) {
        return res.status(400).json({ msg: "El tipo de recurso es requerido" });
      }

      const recurso = await recursoRepository.create({
        nombre, url, id_tipo_recurso, id_modelo, id_empresa,
        es_principal, orden,
        usuario_registro, usuario_actualizacion: usuario_registro
      });

      return res.status(201).json({ msg: "Recurso creado exitosamente", data: { id: recurso.id } });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al crear recurso: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear recurso" });
    }
  }

  async createBatch(req, res) {
    try {
      const { recursos } = req.body;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!recursos || !Array.isArray(recursos) || recursos.length === 0) {
        return res.status(400).json({ msg: "Se requiere un array de recursos" });
      }

      const items = recursos.map((r, i) => ({
        nombre: r.nombre,
        url: r.url,
        id_tipo_recurso: r.id_tipo_recurso,
        id_modelo: r.id_modelo ?? null,
        es_principal: r.es_principal ?? 0,
        orden: r.orden ?? i,
        id_empresa,
        usuario_registro,
        usuario_actualizacion: usuario_registro
      }));

      const created = await recursoRepository.createBatch(items);

      return res.status(201).json({
        msg: `${created.length} recursos creados exitosamente`,
        data: created.map(r => ({ id: r.id }))
      });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al crear recursos en batch: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear recursos" });
    }
  }

  async reorderRecursos(req, res) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ msg: "Se requiere un array de items con id, orden y es_principal" });
      }

      await recursoRepository.reorder(items);

      return res.status(200).json({ msg: "Orden actualizado exitosamente" });
    } catch (error) {
      logger.error(`[recurso.controller.js] Error al reordenar recursos: ${error.message}`);
      return res.status(500).json({ msg: "Error al reordenar recursos" });
    }
  }

  async updateRecurso(req, res) {
    try {
      const { id } = req.params;
      const { nombre, url, id_tipo_recurso } = req.body;
      const id_modelo = req.body.id_modelo ?? null;
      const es_principal = req.body.es_principal;
      const orden = req.body.orden;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const updateData = { nombre, url, id_tipo_recurso, id_modelo, usuario_actualizacion };
      if (es_principal !== undefined) updateData.es_principal = es_principal;
      if (orden !== undefined) updateData.orden = orden;

      const [updated] = await recursoRepository.update(id, updateData);

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
