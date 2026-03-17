const proyectoRepository = require("../repositories/proyecto.repository.js");
const logger = require('../config/logger/loggerClient.js');

class ProyectoController {
  async getProyectos(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const proyectos = await proyectoRepository.findAll(idEmpresa);
      return res.status(200).json({ data: proyectos });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al obtener proyectos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proyectos" });
    }
  }

  async getProyectoById(req, res) {
    try {
      const { id } = req.params;
      const proyecto = await proyectoRepository.findById(id);

      if (!proyecto) {
        return res.status(404).json({ msg: "Proyecto no encontrado" });
      }

      return res.status(200).json({ data: proyecto });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al obtener proyecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proyecto" });
    }
  }

  async getProyectosByNombre(req, res) {
    try {
      const { nombre, distrito } = req.query;

      if (!nombre) {
        return res.status(400).json({ msg: "nombre es requerido" });
      }

      const proyectos = await proyectoRepository.findByNombre(nombre, distrito || null);
      return res.status(200).json({ data: proyectos });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al obtener proyectos por nombre: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proyectos por nombre" });
    }
  }

  async getProyectosByDistrito(req, res) {
    try {
      const { distrito } = req.query;

      if (!distrito) {
        return res.status(400).json({ msg: "distrito es requerido" });
      }

      const proyectos = await proyectoRepository.findByDistrito(distrito);
      return res.status(200).json({ data: proyectos });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al obtener proyectos por distrito: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener proyectos por distrito" });
    }
  }

  async createProyecto(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, estado_proyecto, direccion, pais, ciudad, id_distrito, sperant_id, url_google_maps, descripcion } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre || !estado_proyecto) {
        return res.status(400).json({ msg: "El nombre y estado del proyecto son requeridos" });
      }

      const proyecto = await proyectoRepository.create({
        nombre, estado_proyecto, direccion, pais, ciudad, id_distrito,
        id_empresa: idEmpresa, usuario_registro, sperant_id, url_google_maps, descripcion
      });

      return res.status(201).json({ msg: "Proyecto creado exitosamente", data: { id: proyecto.id } });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al crear proyecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear proyecto" });
    }
  }

  async updateProyecto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, estado_proyecto, direccion, pais, ciudad, id_distrito, url_google_maps, descripcion } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre || !estado_proyecto) {
        return res.status(400).json({ msg: "El nombre y estado del proyecto son requeridos" });
      }

      const updateData = {
        nombre, estado_proyecto, direccion, pais, ciudad, id_distrito, url_google_maps, descripcion, usuario_actualizacion
      };

      const [updated] = await proyectoRepository.update(id, updateData);

      if (!updated) {
        return res.status(404).json({ msg: "Proyecto no encontrado" });
      }

      return res.status(200).json({ msg: "Proyecto actualizado exitosamente" });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al actualizar proyecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar proyecto" });
    }
  }

  async deleteProyecto(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await proyectoRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Proyecto no encontrado" });
      }

      return res.status(200).json({ msg: "Proyecto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[proyecto.controller.js] Error al eliminar proyecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar proyecto" });
    }
  }
}

module.exports = new ProyectoController();
