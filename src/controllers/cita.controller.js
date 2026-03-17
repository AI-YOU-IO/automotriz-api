const citaRepository = require("../repositories/cita.repository.js");
const logger = require('../config/logger/loggerClient.js');

class CitaController {
  async getCitas(req, res) {
    try {
      const citas = await citaRepository.findAll();
      return res.status(200).json({ data: citas });
    } catch (error) {
      logger.error(`[cita.controller.js] Error al obtener citas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener citas" });
    }
  }

  async getCitaById(req, res) {
    try {
      const { id } = req.params;
      const cita = await citaRepository.findById(id);

      if (!cita) {
        return res.status(404).json({ msg: "Cita no encontrada" });
      }

      return res.status(200).json({ data: cita });
    } catch (error) {
      logger.error(`[cita.controller.js] Error al obtener cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener cita" });
    }
  }

  async createCita(req, res) {
    try {
      const { nombre, hora_inicio, hora_fin, lugar, descripcion, id_prospecto, id_proyecto, id_unidad, id_estado_cita } = req.body;
      const id_usuario = req.user?.userId || null;
      const usuario_registro = req.user?.userId || null;

      if (!nombre || !hora_inicio || !hora_fin || !lugar || !id_prospecto || !id_proyecto || !id_unidad || !id_estado_cita) {
        return res.status(400).json({ msg: "Nombre, hora inicio, hora fin, lugar, prospecto, proyecto, unidad y estado son requeridos" });
      }

      const cita = await citaRepository.create({
        nombre, hora_inicio, hora_fin, lugar, descripcion, id_prospecto,
        id_proyecto, id_unidad, id_estado_cita, id_usuario, usuario_registro
      });

      return res.status(201).json({ msg: "Cita creada exitosamente", data: { id: cita.id } });
    } catch (error) {
      logger.error(`[cita.controller.js] Error al crear cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear cita" });
    }
  }

  async updateCita(req, res) {
    try {
      const { id } = req.params;
      const { nombre, hora_inicio, hora_fin, lugar, descripcion, id_prospecto, id_proyecto, id_unidad, id_estado_cita } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre || !hora_inicio || !hora_fin || !id_estado_cita) {
        return res.status(400).json({ msg: "Nombre, hora inicio, hora fin y estado son requeridos" });
      }

      const [updated] = await citaRepository.update(id, {
        nombre, hora_inicio, hora_fin, lugar: lugar || null, descripcion: descripcion || null,
        id_prospecto: id_prospecto || null, id_proyecto: id_proyecto || null,
        id_unidad: id_unidad || null, id_estado_cita, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Cita no encontrada" });
      }

      return res.status(200).json({ msg: "Cita actualizada exitosamente" });
    } catch (error) {
      logger.error(`[cita.controller.js] Error al actualizar cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar cita" });
    }
  }

  async getHorariosOcupados(req, res) {
    try {
      const { id_usuario } = req.query;

      if (!id_usuario) {
        return res.status(400).json({ msg: "id_usuario es requerido" });
      }

      const horarios = await citaRepository.findHorariosOcupados(id_usuario);
      return res.status(200).json({ data: horarios });
    } catch (error) {
      logger.error(`[cita.controller.js] Error al obtener horarios ocupados: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener horarios ocupados" });
    }
  }

  async deleteCita(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await citaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Cita no encontrada" });
      }

      return res.status(200).json({ msg: "Cita eliminada exitosamente" });
    } catch (error) {
      logger.error(`[cita.controller.js] Error al eliminar cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar cita" });
    }
  }
}

module.exports = new CitaController();
