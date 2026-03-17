const rolRepository = require("../repositories/rol.repository.js");
const logger = require('../config/logger/loggerClient.js');

class RolController {
  async getRoles(req, res) {
    try {
      const roles = await rolRepository.findAll();
      return res.status(200).json({ data: roles });
    } catch (error) {
      logger.error(`[rol.controller.js] Error al obtener roles: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener roles" });
    }
  }

  async getRolById(req, res) {
    try {
      const { id } = req.params;
      const rol = await rolRepository.findById(id);

      if (!rol) {
        return res.status(404).json({ msg: "Rol no encontrado" });
      }

      const modulos = await rolRepository.findModulosByRol(id);

      const rolData = rol.toJSON();
      rolData.modulos = modulos;

      return res.status(200).json({ data: rolData });
    } catch (error) {
      logger.error(`[rol.controller.js] Error al obtener rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener rol" });
    }
  }

  async createRol(req, res) {
    try {
      const { nombre, descripcion, modulos } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const rol = await rolRepository.create({ nombre, descripcion });

      if (modulos && modulos.length > 0) {
        await rolRepository.assignModulos(rol.id, modulos);
      }

      return res.status(201).json({ msg: "Rol creado exitosamente", data: { id: rol.id } });
    } catch (error) {
      logger.error(`[rol.controller.js] Error al crear rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear rol" });
    }
  }

  async updateRol(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, modulos } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      await rolRepository.update(id, { nombre, descripcion });

      await rolRepository.removeAllModulos(id);
      if (modulos && modulos.length > 0) {
        await rolRepository.assignModulos(id, modulos);
      }

      return res.status(200).json({ msg: "Rol actualizado exitosamente" });
    } catch (error) {
      logger.error(`[rol.controller.js] Error al actualizar rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar rol" });
    }
  }

  async deleteRol(req, res) {
    try {
      const { id } = req.params;
      await rolRepository.delete(id);
      return res.status(200).json({ msg: "Rol eliminado exitosamente" });
    } catch (error) {
      logger.error(`[rol.controller.js] Error al eliminar rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar rol" });
    }
  }
}

module.exports = new RolController();
