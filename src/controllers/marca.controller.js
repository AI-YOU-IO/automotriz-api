const marcaRepository = require('../repositories/marca.repository.js');
const logger = require('../config/logger/loggerClient.js');

class MarcaController {
  async getMarcas(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const marcas = await marcaRepository.findAll(idEmpresa);
      return res.status(200).json({ data: marcas });
    } catch (error) {
      logger.error(`[marca.controller.js] Error al obtener marcas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener marcas" });
    }
  }

  async getMarcaById(req, res) {
    try {
      const { id } = req.params;
      const marca = await marcaRepository.findById(id);
      if (!marca) return res.status(404).json({ msg: "Marca no encontrada" });
      return res.status(200).json({ data: marca });
    } catch (error) {
      logger.error(`[marca.controller.js] Error al obtener marca: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener marca" });
    }
  }

  async createMarca(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, descripcion } = req.body;
      if (!nombre) return res.status(400).json({ msg: "El nombre es requerido" });
      if (!idEmpresa) return res.status(400).json({ msg: "La empresa es requerida" });

      const usuario_registro = req.user?.userId || null;
      const marca = await marcaRepository.create({ nombre, descripcion, id_empresa: idEmpresa, usuario_registro });
      return res.status(201).json({ msg: "Marca creada exitosamente", data: { id: marca.id } });
    } catch (error) {
      logger.error(`[marca.controller.js] Error al crear marca: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear marca" });
    }
  }

  async updateMarca(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      if (!nombre) return res.status(400).json({ msg: "El nombre es requerido" });
      await marcaRepository.update(id, { nombre, descripcion });
      return res.status(200).json({ msg: "Marca actualizada exitosamente" });
    } catch (error) {
      logger.error(`[marca.controller.js] Error al actualizar marca: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar marca" });
    }
  }

  async deleteMarca(req, res) {
    try {
      const { id } = req.params;
      await marcaRepository.delete(id);
      return res.status(200).json({ msg: "Marca eliminada exitosamente" });
    } catch (error) {
      logger.error(`[marca.controller.js] Error al eliminar marca: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar marca" });
    }
  }
}

module.exports = new MarcaController();
