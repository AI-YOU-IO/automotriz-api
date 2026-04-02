/**
 * Controlador n8n para gestión de Citas
 *
 * Endpoints:
 * - POST /n8n/citas - Crear cita
 * - GET /n8n/citas/:id - Obtener cita por ID
 * - GET /n8n/citas/prospecto/:id_prospecto - Obtener citas por prospecto
 * - PUT /n8n/citas/:id - Actualizar cita
 * - DELETE /n8n/citas/:id - Eliminar cita (soft delete)
 */

const { Cita, Prospecto, Marca, Modelo, Version, EstadoCita, Usuario } = require('../models/sequelize');
const logger = require('../config/logger/loggerClient');

class N8nCitaController {

  /**
   * POST /n8n/citas
   * Crear nueva cita
   */
  async crear(req, res) {
    try {
      const {
        nombre,
        hora_inicio,
        hora_fin,
        lugar = null,
        descripcion = null,
        id_prospecto,
        id_marca = null,
        id_modelo = null,
        id_version = null,
        id_estado_cita = 1,
        id_usuario
      } = req.body;

      // Validaciones
      if (!nombre) {
        return res.status(400).json({
          success: false,
          error: 'nombre es requerido'
        });
      }

      if (!hora_inicio || !hora_fin) {
        return res.status(400).json({
          success: false,
          error: 'hora_inicio y hora_fin son requeridos'
        });
      }

      if (!id_usuario) {
        return res.status(400).json({
          success: false,
          error: 'id_usuario es requerido'
        });
      }

      // Verificar que el prospecto existe si se proporciona
      if (id_prospecto) {
        const prospecto = await Prospecto.findByPk(id_prospecto);
        if (!prospecto) {
          return res.status(404).json({
            success: false,
            error: 'Prospecto no encontrado'
          });
        }
      }

      // Verificar que el usuario existe
      const usuario = await Usuario.findByPk(id_usuario);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Crear cita
      const cita = await Cita.create({
        nombre,
        hora_inicio: new Date(hora_inicio),
        hora_fin: new Date(hora_fin),
        lugar,
        descripcion,
        id_prospecto,
        id_marca,
        id_modelo,
        id_version,
        id_estado_cita,
        id_usuario,
        usuario_registro: null,
        estado_registro: 1
      });

      logger.info(`[n8nCita] Creada: ${cita.id} - ${nombre}`);

      return res.json({
        success: true,
        cita: {
          id: cita.id,
          nombre: cita.nombre,
          hora_inicio: cita.hora_inicio,
          hora_fin: cita.hora_fin,
          lugar: cita.lugar,
          descripcion: cita.descripcion,
          id_prospecto: cita.id_prospecto,
          id_marca: cita.id_marca,
          id_modelo: cita.id_modelo,
          id_version: cita.id_version,
          id_estado_cita: cita.id_estado_cita,
          id_usuario: cita.id_usuario
        }
      });

    } catch (error) {
      logger.error(`[n8nCita] Error crear: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/citas/:id
   * Obtener cita por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      const cita = await Cita.findByPk(id, {
        include: [
          { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular'] },
          { model: Marca, as: 'marca', attributes: ['id', 'nombre'] },
          { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'] },
          { model: Version, as: 'version', attributes: ['id', 'nombre'] },
          { model: EstadoCita, as: 'estadoCita', attributes: ['id', 'nombre', 'color'] },
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'] }
        ]
      });

      if (!cita) {
        return res.status(404).json({
          success: false,
          error: 'Cita no encontrada'
        });
      }

      return res.json({
        success: true,
        cita: {
          id: cita.id,
          nombre: cita.nombre,
          hora_inicio: cita.hora_inicio,
          hora_fin: cita.hora_fin,
          lugar: cita.lugar,
          descripcion: cita.descripcion,
          id_prospecto: cita.id_prospecto,
          id_marca: cita.id_marca,
          id_modelo: cita.id_modelo,
          id_version: cita.id_version,
          id_estado_cita: cita.id_estado_cita,
          id_usuario: cita.id_usuario,
          prospecto: cita.prospecto ? {
            id: cita.prospecto.id,
            nombre: cita.prospecto.nombre_completo,
            celular: cita.prospecto.celular
          } : null,
          marca: cita.marca ? {
            id: cita.marca.id,
            nombre: cita.marca.nombre
          } : null,
          modelo: cita.modelo ? {
            id: cita.modelo.id,
            nombre: cita.modelo.nombre
          } : null,
          version: cita.version ? {
            id: cita.version.id,
            nombre: cita.version.nombre
          } : null,
          estado: cita.estadoCita ? {
            id: cita.estadoCita.id,
            nombre: cita.estadoCita.nombre,
            color: cita.estadoCita.color
          } : null,
          usuario: cita.usuario ? {
            id: cita.usuario.id,
            nombre: cita.usuario.usuario
          } : null
        }
      });

    } catch (error) {
      logger.error(`[n8nCita] Error obtenerPorId: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/citas/prospecto/:id_prospecto
   * Obtener citas por prospecto
   */
  async obtenerPorProspecto(req, res) {
    try {
      const { id_prospecto } = req.params;

      const citas = await Cita.findAll({
        where: {
          id_prospecto: parseInt(id_prospecto),
          estado_registro: 1
        },
        include: [
          { model: EstadoCita, as: 'estadoCita', attributes: ['id', 'nombre', 'color'] },
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'] }
        ],
        order: [['hora_inicio', 'DESC']]
      });

      return res.json({
        success: true,
        citas: citas.map(c => ({
          id: c.id,
          nombre: c.nombre,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          lugar: c.lugar,
          descripcion: c.descripcion,
          id_estado_cita: c.id_estado_cita,
          estado: c.estadoCita ? {
            id: c.estadoCita.id,
            nombre: c.estadoCita.nombre,
            color: c.estadoCita.color
          } : null,
          usuario: c.usuario ? {
            id: c.usuario.id,
            nombre: c.usuario.usuario
          } : null
        })),
        total: citas.length
      });

    } catch (error) {
      logger.error(`[n8nCita] Error obtenerPorProspecto: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /n8n/citas/:id
   * Actualizar cita
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre,
        hora_inicio,
        hora_fin,
        lugar,
        descripcion,
        id_prospecto,
        id_marca,
        id_modelo,
        id_version,
        id_estado_cita,
        id_usuario
      } = req.body;

      const cita = await Cita.findByPk(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          error: 'Cita no encontrada'
        });
      }

      const datosActualizar = {};
      if (nombre !== undefined) datosActualizar.nombre = nombre;
      if (hora_inicio !== undefined) datosActualizar.hora_inicio = new Date(hora_inicio);
      if (hora_fin !== undefined) datosActualizar.hora_fin = new Date(hora_fin);
      if (lugar !== undefined) datosActualizar.lugar = lugar;
      if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
      if (id_prospecto !== undefined) datosActualizar.id_prospecto = id_prospecto;
      if (id_marca !== undefined) datosActualizar.id_marca = id_marca;
      if (id_modelo !== undefined) datosActualizar.id_modelo = id_modelo;
      if (id_version !== undefined) datosActualizar.id_version = id_version;
      if (id_estado_cita !== undefined) datosActualizar.id_estado_cita = id_estado_cita;
      if (id_usuario !== undefined) datosActualizar.id_usuario = id_usuario;

      await Cita.update(datosActualizar, { where: { id } });

      const citaActualizada = await Cita.findByPk(id);

      logger.info(`[n8nCita] Actualizada: ${id}`);

      return res.json({
        success: true,
        cita: {
          id: citaActualizada.id,
          nombre: citaActualizada.nombre,
          hora_inicio: citaActualizada.hora_inicio,
          hora_fin: citaActualizada.hora_fin,
          lugar: citaActualizada.lugar,
          descripcion: citaActualizada.descripcion,
          id_prospecto: citaActualizada.id_prospecto,
          id_estado_cita: citaActualizada.id_estado_cita,
          id_usuario: citaActualizada.id_usuario
        }
      });

    } catch (error) {
      logger.error(`[n8nCita] Error actualizar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /n8n/citas/:id
   * Eliminar cita (soft delete)
   */
  async eliminar(req, res) {
    try {
      const { id } = req.params;

      const cita = await Cita.findByPk(id);
      if (!cita) {
        return res.status(404).json({
          success: false,
          error: 'Cita no encontrada'
        });
      }

      await Cita.update({ estado_registro: 0 }, { where: { id } });

      logger.info(`[n8nCita] Eliminada: ${id}`);

      return res.json({
        success: true,
        message: 'Cita eliminada correctamente'
      });

    } catch (error) {
      logger.error(`[n8nCita] Error eliminar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nCitaController();
