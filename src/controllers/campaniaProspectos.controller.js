const campaniaProspectosRepository = require("../repositories/campaniaProspectos.repository.js");
const logger = require('../config/logger/loggerClient.js');

class CampaniaProspectosController {
  async getCampaniaProspectos(req, res) {
    try {
      const campaniaProspectos = await campaniaProspectosRepository.findAll();
      return res.status(200).json({ data: campaniaProspectos });
    } catch (error) {
      logger.error(`[campaniaProspectos.controller.js] Error al obtener campaña-prospectos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campaña-prospectos" });
    }
  }

  async getCampaniaProspectoById(req, res) {
    try {
      const { id } = req.params;
      const campaniaProspecto = await campaniaProspectosRepository.findById(id);

      if (!campaniaProspecto) {
        return res.status(404).json({ msg: "Campaña-prospecto no encontrado" });
      }

      return res.status(200).json({ data: campaniaProspecto });
    } catch (error) {
      logger.error(`[campaniaProspectos.controller.js] Error al obtener campaña-prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campaña-prospecto" });
    }
  }

  async createCampaniaProspecto(req, res) {
    try {
      const { id_campania, id_prospecto } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_campania || !id_prospecto) {
        return res.status(400).json({ msg: "La campaña y prospecto son requeridos" });
      }

      const campaniaProspecto = await campaniaProspectosRepository.create({
        id_campania, id_prospecto, usuario_registro
      });

      return res.status(201).json({ msg: "Campaña-prospecto creado exitosamente", data: { id: campaniaProspecto.id } });
    } catch (error) {
      logger.error(`[campaniaProspectos.controller.js] Error al crear campaña-prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear campaña-prospecto" });
    }
  }

  async updateCampaniaProspecto(req, res) {
    try {
      const { id } = req.params;
      const { id_campania, id_prospecto } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id_campania || !id_prospecto) {
        return res.status(400).json({ msg: "La campaña y prospecto son requeridos" });
      }

      const [updated] = await campaniaProspectosRepository.update(id, {
        id_campania, id_prospecto, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Campaña-prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Campaña-prospecto actualizado exitosamente" });
    } catch (error) {
      logger.error(`[campaniaProspectos.controller.js] Error al actualizar campaña-prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar campaña-prospecto" });
    }
  }

  async deleteCampaniaProspecto(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await campaniaProspectosRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Campaña-prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Campaña-prospecto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[campaniaProspectos.controller.js] Error al eliminar campaña-prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar campaña-prospecto" });
    }
  }
}

module.exports = new CampaniaProspectosController();
