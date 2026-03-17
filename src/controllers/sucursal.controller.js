const sucursalRepository = require("../repositories/sucursal.repository.js");
const logger = require('../config/logger/loggerClient.js');

class SucursalController {
  async getSucursales(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const sucursales = await sucursalRepository.findAll(idEmpresa);
      return res.status(200).json({ data: sucursales });
    } catch (error) {
      logger.error(`[sucursal.controller.js] Error al obtener sucursales: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener sucursales" });
    }
  }

  async getSucursalById(req, res) {
    try {
      const { id } = req.params;
      const sucursal = await sucursalRepository.findById(id);

      if (!sucursal) {
        return res.status(404).json({ msg: "Sucursal no encontrada" });
      }

      return res.status(200).json({ data: sucursal });
    } catch (error) {
      logger.error(`[sucursal.controller.js] Error al obtener sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener sucursal" });
    }
  }

  async createSucursal(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, definicion, orden, color, flag_asesor, flag_bot } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const usuario_registro = req.user?.userId || null;
      const sucursal = await sucursalRepository.create({
        nombre, definicion, orden, color, flag_asesor, flag_bot, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Sucursal creada exitosamente", data: { id: sucursal.id } });
    } catch (error) {
      logger.error(`[sucursal.controller.js] Error al crear sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear sucursal" });
    }
  }

  async updateSucursal(req, res) {
    try {
      const { id } = req.params;
      const { nombre, definicion, orden, color, flag_asesor, flag_bot } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const usuario_actualizacion = req.user?.userId || null;
      await sucursalRepository.update(id, { nombre, definicion, orden, color, flag_asesor, flag_bot, usuario_actualizacion });

      return res.status(200).json({ msg: "Sucursal actualizada exitosamente" });
    } catch (error) {
      logger.error(`[sucursal.controller.js] Error al actualizar sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar sucursal" });
    }
  }

  async deleteSucursal(req, res) {
    try {
      const { id } = req.params;
      await sucursalRepository.delete(id);
      return res.status(200).json({ msg: "Sucursal eliminada exitosamente" });
    } catch (error) {
      logger.error(`[sucursal.controller.js] Error al eliminar sucursal: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar sucursal" });
    }
  }
}

module.exports = new SucursalController();
