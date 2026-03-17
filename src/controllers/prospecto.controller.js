const prospectoRepository = require("../repositories/prospecto.repository.js");
const logger = require('../config/logger/loggerClient.js');

class ProspectoController {
  async getProspectos(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const prospectos = await prospectoRepository.findAll(idEmpresa);
      return res.status(200).json({ data: prospectos });
    } catch (error) {
      logger.error(`[prospecto.controller.js] Error al obtener prospectos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener prospectos" });
    }
  }

  async getProspectoById(req, res) {
    try {
      const { id } = req.params;
      const prospecto = await prospectoRepository.findById(id);

      if (!prospecto) {
        return res.status(404).json({ msg: "Prospecto no encontrado" });
      }

      return res.status(200).json({ data: prospecto });
    } catch (error) {
      logger.error(`[prospecto.controller.js] Error al obtener prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener prospecto" });
    }
  }

  async createProspecto(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { id_estado_prospecto, id_usuario, nombre_completo, dni, direccion, celular, perfilamiento, puntaje } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre_completo || !celular || !id_estado_prospecto) {
        return res.status(400).json({ msg: "Nombre completo, celular y estado son requeridos" });
      }

      const prospecto = await prospectoRepository.create({
        id_estado_prospecto, id_usuario, nombre_completo, dni, direccion, celular,
        perfilamiento, puntaje, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Prospecto creado exitosamente", data: { id: prospecto.id } });
    } catch (error) {
      logger.error(`[prospecto.controller.js] Error al crear prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear prospecto" });
    }
  }

  async updateProspecto(req, res) {
    try {
      const { id } = req.params;
      const { id_estado_prospecto, id_usuario, nombre_completo, dni, direccion, celular, perfilamiento, puntaje } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre_completo || !dni || !celular || !id_estado_prospecto) {
        return res.status(400).json({ msg: "Nombre completo, DNI, celular y estado son requeridos" });
      }

      const [updated] = await prospectoRepository.update(id, {
        id_estado_prospecto, id_usuario, nombre_completo, dni, direccion, celular,
        perfilamiento, puntaje, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Prospecto actualizado exitosamente" });
    } catch (error) {
      logger.error(`[prospecto.controller.js] Error al actualizar prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar prospecto" });
    }
  }

  async deleteProspecto(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await prospectoRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Prospecto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[prospecto.controller.js] Error al eliminar prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar prospecto" });
    }
  }
}

module.exports = new ProspectoController();
