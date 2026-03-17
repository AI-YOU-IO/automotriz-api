const moduloRepository = require("../repositories/modulo.repository.js");
const logger = require('../config/logger/loggerClient.js');

class ModuloController {
  async getModulos(req, res) {
    try {
      const modulos = await moduloRepository.findAll();
      return res.status(200).json({ data: modulos });
    } catch (error) {
      logger.error(`[modulo.controller.js] Error al obtener módulos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener módulos" });
    }
  }

  async getModuloById(req, res) {
    try {
      const { id } = req.params;
      const modulo = await moduloRepository.findById(id);

      if (!modulo) {
        return res.status(404).json({ msg: "Módulo no encontrado" });
      }

      return res.status(200).json({ data: modulo });
    } catch (error) {
      logger.error(`[modulo.controller.js] Error al obtener módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener módulo" });
    }
  }

  async createModulo(req, res) {
    try {
      const { nombre, url, icono, orden } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const modulo = await moduloRepository.create({ nombre, url, icono, orden });

      return res.status(201).json({ msg: "Módulo creado exitosamente", data: { id: modulo.id } });
    } catch (error) {
      logger.error(`[modulo.controller.js] Error al crear módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear módulo" });
    }
  }

  async updateModulo(req, res) {
    try {
      const { id } = req.params;
      const { nombre, url, icono, orden } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      await moduloRepository.update(id, { nombre, url, icono, orden });

      return res.status(200).json({ msg: "Módulo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[modulo.controller.js] Error al actualizar módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar módulo" });
    }
  }

  async deleteModulo(req, res) {
    try {
      const { id } = req.params;
      await moduloRepository.delete(id);
      return res.status(200).json({ msg: "Módulo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[modulo.controller.js] Error al eliminar módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar módulo" });
    }
  }
}

module.exports = new ModuloController();
