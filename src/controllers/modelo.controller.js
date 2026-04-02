const modeloRepository = require('../repositories/modelo.repository.js');
const logger = require('../config/logger/loggerClient.js');

class ModeloController {
  async getModelos(req, res) {
    try {
      const { id_marca } = req.query;
      const modelos = await modeloRepository.findAll(id_marca);
      return res.status(200).json({ data: modelos });
    } catch (error) {
      logger.error(`[modelo.controller.js] Error al obtener modelos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener modelos" });
    }
  }

  async getModeloById(req, res) {
    try {
      const { id } = req.params;
      const modelo = await modeloRepository.findById(id);
      if (!modelo) return res.status(404).json({ msg: "Modelo no encontrado" });
      return res.status(200).json({ data: modelo });
    } catch (error) {
      logger.error(`[modelo.controller.js] Error al obtener modelo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener modelo" });
    }
  }

  async createModelo(req, res) {
    try {
      const { nombre, descripcion, id_marca } = req.body;
      if (!nombre || !id_marca) return res.status(400).json({ msg: "Nombre y marca son requeridos" });

      const usuario_registro = req.user?.userId || null;
      const modelo = await modeloRepository.create({ nombre, descripcion, id_marca, usuario_registro });
      return res.status(201).json({ msg: "Modelo creado exitosamente", data: { id: modelo.id } });
    } catch (error) {
      logger.error(`[modelo.controller.js] Error al crear modelo: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear modelo" });
    }
  }

  async updateModelo(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, id_marca } = req.body;
      if (!nombre) return res.status(400).json({ msg: "El nombre es requerido" });

      const usuario_actualizacion = req.user?.userId || null;
      await modeloRepository.update(id, { nombre, descripcion, id_marca, usuario_actualizacion });
      return res.status(200).json({ msg: "Modelo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[modelo.controller.js] Error al actualizar modelo: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar modelo" });
    }
  }

  async deleteModelo(req, res) {
    try {
      const { id } = req.params;
      await modeloRepository.delete(id);
      return res.status(200).json({ msg: "Modelo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[modelo.controller.js] Error al eliminar modelo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar modelo" });
    }
  }
}

module.exports = new ModeloController();
