const formatoCampoRepository = require("../repositories/formatoCampo.repository.js");
const logger = require('../config/logger/loggerClient.js');

class FormatoCampoController {
  async getFormatoCampos(req, res) {
    try {
      const { idFormato } = req.params;
      const campos = await formatoCampoRepository.findAll(idFormato);
      return res.status(200).json({ data: campos });
    } catch (error) {
      logger.error(`[formatoCampo.controller.js] Error al obtener campos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campos" });
    }
  }

  async getFormatoCampoById(req, res) {
    try {
      const { id } = req.params;
      const campo = await formatoCampoRepository.findById(id);
      if (!campo) {
        return res.status(404).json({ msg: "Campo no encontrado" });
      }
      return res.status(200).json({ data: campo });
    } catch (error) {
      logger.error(`[formatoCampo.controller.js] Error al obtener campo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campo" });
    }
  }

  async createFormatoCampo(req, res) {
    try {
      const { id_formato, nombre_campo, etiqueta, tipo_dato, longitud, requerido, unico, orden, placeholder } = req.body;
      const usuario_registro = req.user?.userId || null;
      if (!id_formato || !nombre_campo) {
        return res.status(400).json({ msg: "El formato y nombre del campo son requeridos" });
      }
      const campo = await formatoCampoRepository.create({
        id_formato, nombre_campo, etiqueta, tipo_dato, longitud,
        requerido: requerido ? 1 : 0, unico: unico ? 1 : 0,
        orden, placeholder, usuario_registro
      });
      return res.status(201).json({ msg: "Campo creado exitosamente", data: { id: campo.id } });
    } catch (error) {
      logger.error(`[formatoCampo.controller.js] Error al crear campo: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear campo" });
    }
  }

  async updateFormatoCampo(req, res) {
    try {
      const { id } = req.params;
      const { nombre_campo, etiqueta, tipo_dato, longitud, requerido, unico, orden, placeholder } = req.body;
      const usuario_actualizacion = req.user?.userId || null;
      const [updated] = await formatoCampoRepository.update(id, {
        nombre_campo, etiqueta, tipo_dato, longitud,
        requerido: requerido ? 1 : 0, unico: unico ? 1 : 0,
        orden, placeholder, usuario_actualizacion
      });
      if (!updated) {
        return res.status(404).json({ msg: "Campo no encontrado" });
      }
      return res.status(200).json({ msg: "Campo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[formatoCampo.controller.js] Error al actualizar campo: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar campo" });
    }
  }

  async deleteFormatoCampo(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await formatoCampoRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({ msg: "Campo no encontrado" });
      }
      return res.status(200).json({ msg: "Campo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[formatoCampo.controller.js] Error al eliminar campo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar campo" });
    }
  }
}

module.exports = new FormatoCampoController();
