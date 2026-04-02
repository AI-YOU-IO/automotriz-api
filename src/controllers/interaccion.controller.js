const interaccionRepository = require("../repositories/interaccion.repository.js");
const logger = require('../config/logger/loggerClient.js');

class InteraccionController {
  async getInteracciones(req, res) {
    try {
      const interacciones = await interaccionRepository.findAll();
      return res.status(200).json({ data: interacciones });
    } catch (error) {
      logger.error(`[interaccion.controller.js] Error al obtener interacciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener interacciones" });
    }
  }

  async getInteraccionById(req, res) {
    try {
      const { id } = req.params;
      const interaccion = await interaccionRepository.findById(id);

      if (!interaccion) {
        return res.status(404).json({ msg: "Interacción no encontrada" });
      }

      return res.status(200).json({ data: interaccion });
    } catch (error) {
      logger.error(`[interaccion.controller.js] Error al obtener interacción: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener interacción" });
    }
  }

  async createInteraccion(req, res) {
    try {
      const { id_prospecto, id_tipo_interaccion, id_marca, id_modelo, id_version, id_nivel_interes, satisfactorio, observaciones, motivo_desistimiento, preguntas_resumen } = req.body;
      const id_usuario = req.user?.userId || null;

      if (!id_prospecto || !id_tipo_interaccion || !id_marca) {
        return res.status(400).json({ msg: "Prospecto, tipo interacción y marca son requeridos" });
      }

      const interaccion = await interaccionRepository.create({
        id_prospecto, id_tipo_interaccion, id_marca, id_modelo, id_version, id_nivel_interes,
        satisfactorio, observaciones, motivo_desistimiento, preguntas_resumen,
        id_usuario
      });

      return res.status(201).json({ msg: "Interacción creada exitosamente", data: { id: interaccion.id } });
    } catch (error) {
      logger.error(`[interaccion.controller.js] Error al crear interacción: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear interacción" });
    }
  }

  async updateInteraccion(req, res) {
    try {
      const { id } = req.params;
      const { id_prospecto, id_tipo_interaccion, id_marca, id_modelo, id_version, id_nivel_interes, satisfactorio, observaciones, motivo_desistimiento, preguntas_resumen } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await interaccionRepository.update(id, {
        id_prospecto, id_tipo_interaccion, id_marca, id_modelo, id_version, id_nivel_interes,
        satisfactorio, observaciones, motivo_desistimiento, preguntas_resumen,
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Interacción no encontrada" });
      }

      return res.status(200).json({ msg: "Interacción actualizada exitosamente" });
    } catch (error) {
      logger.error(`[interaccion.controller.js] Error al actualizar interacción: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar interacción" });
    }
  }

  async deleteInteraccion(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await interaccionRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Interacción no encontrada" });
      }

      return res.status(200).json({ msg: "Interacción eliminada exitosamente" });
    } catch (error) {
      logger.error(`[interaccion.controller.js] Error al eliminar interacción: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar interacción" });
    }
  }
}

module.exports = new InteraccionController();
