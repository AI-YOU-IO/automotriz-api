/**
 * Controlador n8n para gestión de Proyectos
 *
 * Endpoints:
 * - GET /n8n/proyectos/:id - Obtener proyecto por ID
 * - GET /n8n/proyectos - Listar todos los proyectos
 * - GET /n8n/proyectos/buscar/nombre - Buscar por nombre
 * - GET /n8n/proyectos/buscar/distrito - Buscar por distrito
 * - GET /n8n/proyectos/sperant/:sperant_id - Buscar por sperant_id
 */

const { Proyecto, Distrito } = require('../models/sequelize');
const logger = require('../config/logger/loggerClient');

class N8nProyectoController {

  /**
   * GET /n8n/proyectos/:id
   * Obtener proyecto por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      const proyecto = await Proyecto.findByPk(id, {
        include: [
          { model: Distrito, as: 'distrito', attributes: ['id', 'nombre'] }
        ]
      });

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          error: 'Proyecto no encontrado'
        });
      }

      return res.json({
        success: true,
        proyecto: {
          id: proyecto.id,
          nombre: proyecto.nombre,
          estado_proyecto: proyecto.estado_proyecto,
          direccion: proyecto.direccion,
          sperant_id: proyecto.sperant_id,
          url_google_maps: proyecto.url_google_maps,
          descripcion: proyecto.descripcion,
          id_empresa: proyecto.id_empresa,
          distrito: proyecto.distrito ? {
            id: proyecto.distrito.id,
            nombre: proyecto.distrito.nombre
          } : null
        }
      });

    } catch (error) {
      logger.error(`[n8nProyecto] Error obtenerPorId: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/proyectos
   * Listar todos los proyectos activos
   */
  async listar(req, res) {
    try {
      const { id_empresa, estado_proyecto } = req.query;

      const whereClause = { estado_registro: 1 };
      if (id_empresa) whereClause.id_empresa = parseInt(id_empresa);
      if (estado_proyecto) whereClause.estado_proyecto = estado_proyecto;

      const proyectos = await Proyecto.findAll({
        where: whereClause,
        include: [
          { model: Distrito, as: 'distrito', attributes: ['id', 'nombre'] }
        ],
        order: [['nombre', 'ASC']]
      });

      return res.json({
        success: true,
        total: proyectos.length,
        proyectos: proyectos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          estado_proyecto: p.estado_proyecto,
          direccion: p.direccion,
          sperant_id: p.sperant_id,
          id_empresa: p.id_empresa,
          distrito: p.distrito ? {
            id: p.distrito.id,
            nombre: p.distrito.nombre
          } : null
        }))
      });

    } catch (error) {
      logger.error(`[n8nProyecto] Error listar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/proyectos/buscar/nombre
   * Buscar proyectos por nombre
   */
  async buscarPorNombre(req, res) {
    try {
      const { nombre, distrito } = req.query;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          error: 'nombre es requerido'
        });
      }

      const { Op } = require('sequelize');

      const whereClause = {
        estado_registro: 1,
        estado_proyecto: 'activo',
        nombre: { [Op.iLike]: `%${nombre}%` }
      };

      const proyectos = await Proyecto.findAll({
        where: whereClause,
        include: [
          { model: Distrito, as: 'distrito', attributes: ['id', 'nombre'] }
        ],
        order: [['nombre', 'ASC']],
        limit: 10
      });

      // Si se especifica distrito, filtrar resultados
      let resultados = proyectos;
      if (distrito) {
        resultados = proyectos.filter(p =>
          p.distrito && p.distrito.nombre.toLowerCase().includes(distrito.toLowerCase())
        );
        // Si no hay resultados con el filtro de distrito, retornar todos
        if (resultados.length === 0) resultados = proyectos;
      }

      return res.json({
        success: true,
        total: resultados.length,
        proyectos: resultados.map(p => ({
          id: p.id,
          nombre: p.nombre,
          estado_proyecto: p.estado_proyecto,
          direccion: p.direccion,
          sperant_id: p.sperant_id,
          distrito: p.distrito ? {
            id: p.distrito.id,
            nombre: p.distrito.nombre
          } : null
        }))
      });

    } catch (error) {
      logger.error(`[n8nProyecto] Error buscarPorNombre: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/proyectos/buscar/distrito
   * Buscar proyectos por distrito
   */
  async buscarPorDistrito(req, res) {
    try {
      const { distrito } = req.query;

      if (!distrito) {
        return res.status(400).json({
          success: false,
          error: 'distrito es requerido'
        });
      }

      const { Op } = require('sequelize');

      // Buscar distritos que coincidan
      const distritos = await Distrito.findAll({
        where: {
          nombre: { [Op.iLike]: `%${distrito}%` }
        },
        attributes: ['id']
      });

      if (distritos.length === 0) {
        return res.json({
          success: true,
          total: 0,
          proyectos: []
        });
      }

      const distritosIds = distritos.map(d => d.id);

      const proyectos = await Proyecto.findAll({
        where: {
          estado_registro: 1,
          estado_proyecto: 'activo',
          id_distrito: { [Op.in]: distritosIds }
        },
        include: [
          { model: Distrito, as: 'distrito', attributes: ['id', 'nombre'] }
        ],
        order: [['nombre', 'ASC']],
        limit: 10
      });

      return res.json({
        success: true,
        total: proyectos.length,
        proyectos: proyectos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          estado_proyecto: p.estado_proyecto,
          direccion: p.direccion,
          sperant_id: p.sperant_id,
          distrito: p.distrito ? {
            id: p.distrito.id,
            nombre: p.distrito.nombre
          } : null
        }))
      });

    } catch (error) {
      logger.error(`[n8nProyecto] Error buscarPorDistrito: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/proyectos/sperant/:sperant_id
   * Buscar proyecto por sperant_id
   */
  async buscarPorSperantId(req, res) {
    try {
      const { sperant_id } = req.params;

      if (!sperant_id) {
        return res.status(400).json({
          success: false,
          error: 'sperant_id es requerido'
        });
      }

      const proyecto = await Proyecto.findOne({
        where: {
          sperant_id: sperant_id,
          estado_registro: 1
        },
        include: [
          { model: Distrito, as: 'distrito', attributes: ['id', 'nombre'] }
        ]
      });

      if (!proyecto) {
        return res.status(404).json({
          success: false,
          error: 'Proyecto no encontrado'
        });
      }

      return res.json({
        success: true,
        proyecto: {
          id: proyecto.id,
          nombre: proyecto.nombre,
          estado_proyecto: proyecto.estado_proyecto,
          direccion: proyecto.direccion,
          sperant_id: proyecto.sperant_id,
          url_google_maps: proyecto.url_google_maps,
          descripcion: proyecto.descripcion,
          id_empresa: proyecto.id_empresa,
          distrito: proyecto.distrito ? {
            id: proyecto.distrito.id,
            nombre: proyecto.distrito.nombre
          } : null
        }
      });

    } catch (error) {
      logger.error(`[n8nProyecto] Error buscarPorSperantId: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nProyectoController();
