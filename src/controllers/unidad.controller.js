const unidadRepository = require("../repositories/unidad.repository.js");
const logger = require('../config/logger/loggerClient.js');

class UnidadController {
  async getUnidades(req, res) {
    try {
      const { id_proyecto } = req.query;
      let unidades;
      if (id_proyecto) {
        unidades = await unidadRepository.findByProyecto(Number(id_proyecto));
      } else {
        unidades = await unidadRepository.findAll();
      }
      return res.status(200).json({ data: unidades });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al obtener unidades: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener unidades" });
    }
  }

  async getUnidadesByProyecto(req, res) {
    try {
      const { id_proyecto } = req.query;
      const unidades = await unidadRepository.findByProyecto(Number(id_proyecto));
      return res.status(200).json({ data: unidades });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al obtener unidades por proyecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener unidades por proyecto" });
    }
  }

  async getUnidadesByDormitorios(req, res) {
    try {
      const { num } = req.query;
      const unidades = await unidadRepository.findByDormitorios(num);
      return res.status(200).json({ data: unidades });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al obtener unidades por dormitorios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener unidades por dormitorios" });
    }
  }

  async getUnidadById(req, res) {
    try {
      const { id } = req.params;
      const unidad = await unidadRepository.findById(id);

      if (!unidad) {
        return res.status(404).json({ msg: "Unidad no encontrada" });
      }

      return res.status(200).json({ data: unidad });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al obtener unidad: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener unidad" });
    }
  }

  async createUnidad(req, res) {
    try {
      const { estado_comercial, precio, precio_venta, estado_unidad, area_total, moneda, area_construida, area_lote, id_proyecto, id_tipologia, sperant_id } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!estado_comercial || !estado_unidad || !id_proyecto || !id_tipologia) {
        return res.status(400).json({ msg: "Estado comercial, estado unidad, proyecto y tipología son requeridos" });
      }

      const unidad = await unidadRepository.create({
        estado_comercial, precio, precio_venta, estado_unidad, area_total, moneda,
        area_construida, area_lote, id_proyecto, id_tipologia, usuario_registro, sperant_id
      });

      return res.status(201).json({ msg: "Unidad creada exitosamente", data: { id: unidad.id } });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al crear unidad: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear unidad" });
    }
  }

  async updateUnidad(req, res) {
    try {
      const { id } = req.params;
      const { estado_comercial, precio, precio_venta, estado_unidad, area_total, moneda, area_construida, area_lote, id_proyecto, id_tipologia } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!estado_comercial || !estado_unidad || !id_proyecto || !id_tipologia) {
        return res.status(400).json({ msg: "Estado comercial, estado unidad, proyecto y tipología son requeridos" });
      }

      const [updated] = await unidadRepository.update(id, {
        estado_comercial, precio, precio_venta, estado_unidad, area_total, moneda,
        area_construida, area_lote, id_proyecto, id_tipologia, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Unidad no encontrada" });
      }

      return res.status(200).json({ msg: "Unidad actualizada exitosamente" });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al actualizar unidad: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar unidad" });
    }
  }

  async deleteUnidad(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await unidadRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Unidad no encontrada" });
      }

      return res.status(200).json({ msg: "Unidad eliminada exitosamente" });
    } catch (error) {
      logger.error(`[unidad.controller.js] Error al eliminar unidad: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar unidad" });
    }
  }
}

module.exports = new UnidadController();
