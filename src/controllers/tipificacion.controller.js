const tipificacionRepository = require("../repositories/tipificacion.repository.js");
const logger = require('../config/logger/loggerClient.js');

class TipificacionController {
  async getTipificaciones(req, res) {
    try {
      const tipificaciones = await tipificacionRepository.findAll();
      return res.status(200).json({ data: tipificaciones });
    } catch (error) {
      logger.error(`[tipificacion.controller.js] Error al obtener tipificaciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipificaciones" });
    }
  }

  async getTipificacionById(req, res) {
    try {
      const { id } = req.params;
      const tipificacion = await tipificacionRepository.findById(id);

      if (!tipificacion) {
        return res.status(404).json({ msg: "Tipificación no encontrada" });
      }

      return res.status(200).json({ data: tipificacion });
    } catch (error) {
      logger.error(`[tipificacion.controller.js] Error al obtener tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipificación" });
    }
  }

  async createTipificacion(req, res) {
    try {
      const { nombre, tipo, telefono, correo, duracion_cita, fecha_hora_cita, id_marca, id_modelo, id_version, id_prospecto, resumen } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const usuario_registro = req.user?.userId || null;
      const tipificacion = await tipificacionRepository.create({
        nombre, tipo, telefono, correo, duracion_cita, fecha_hora_cita, id_marca, id_modelo, id_version, id_prospecto,
        resumen, usuario_registro
      });

      return res.status(201).json({ msg: "Tipificación creada exitosamente", data: { id: tipificacion.id } });
    } catch (error) {
      logger.error(`[tipificacion.controller.js] Error al crear tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipificación" });
    }
  }

  async updateTipificacion(req, res) {
    try {
      const { id } = req.params;
      const { nombre, tipo, telefono, correo, duracion_cita, fecha_hora_cita, id_marca, id_modelo, id_version, id_prospecto, resumen } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const usuario_actualizacion = req.user?.userId || null;
      await tipificacionRepository.update(id, {
        nombre, tipo, telefono, correo, duracion_cita, fecha_hora_cita, id_marca, id_modelo, id_version, id_prospecto,
        resumen, usuario_actualizacion
      });

      return res.status(200).json({ msg: "Tipificación actualizada exitosamente" });
    } catch (error) {
      logger.error(`[tipificacion.controller.js] Error al actualizar tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar tipificación" });
    }
  }

  async deleteTipificacion(req, res) {
    try {
      const { id } = req.params;
      await tipificacionRepository.delete(id);
      return res.status(200).json({ msg: "Tipificación eliminada exitosamente" });
    } catch (error) {
      logger.error(`[tipificacion.controller.js] Error al eliminar tipificación: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar tipificación" });
    }
  }
}

module.exports = new TipificacionController();
