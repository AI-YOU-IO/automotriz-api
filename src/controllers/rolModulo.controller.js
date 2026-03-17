const rolModuloRepository = require("../repositories/rolModulo.repository.js");
const logger = require('../config/logger/loggerClient.js');

class RolModuloController {
  async getRolModulos(req, res) {
    try {
      const rolModulos = await rolModuloRepository.findAll();
      return res.status(200).json({ data: rolModulos });
    } catch (error) {
      logger.error(`[rolModulo.controller.js] Error al obtener roles-módulos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener roles-módulos" });
    }
  }

  async getRolModuloById(req, res) {
    try {
      const { id } = req.params;
      const rolModulo = await rolModuloRepository.findById(id);

      if (!rolModulo) {
        return res.status(404).json({ msg: "Rol-módulo no encontrado" });
      }

      return res.status(200).json({ data: rolModulo });
    } catch (error) {
      logger.error(`[rolModulo.controller.js] Error al obtener rol-módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener rol-módulo" });
    }
  }

  async createRolModulo(req, res) {
    try {
      const { id_rol, id_modulo } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_rol || !id_modulo) {
        return res.status(400).json({ msg: "El rol y módulo son requeridos" });
      }

      const rolModulo = await rolModuloRepository.create({ id_rol, id_modulo, usuario_registro });

      return res.status(201).json({ msg: "Rol-módulo creado exitosamente", data: { id: rolModulo.id } });
    } catch (error) {
      logger.error(`[rolModulo.controller.js] Error al crear rol-módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear rol-módulo" });
    }
  }

  async updateRolModulo(req, res) {
    try {
      const { id } = req.params;
      const { id_rol, id_modulo } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id_rol || !id_modulo) {
        return res.status(400).json({ msg: "El rol y módulo son requeridos" });
      }

      const [updated] = await rolModuloRepository.update(id, { id_rol, id_modulo, usuario_actualizacion });

      if (!updated) {
        return res.status(404).json({ msg: "Rol-módulo no encontrado" });
      }

      return res.status(200).json({ msg: "Rol-módulo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[rolModulo.controller.js] Error al actualizar rol-módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar rol-módulo" });
    }
  }

  async deleteRolModulo(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await rolModuloRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Rol-módulo no encontrado" });
      }

      return res.status(200).json({ msg: "Rol-módulo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[rolModulo.controller.js] Error al eliminar rol-módulo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar rol-módulo" });
    }
  }
}

module.exports = new RolModuloController();
