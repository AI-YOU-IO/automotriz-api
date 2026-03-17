/**
 * Controlador n8n para gestión de Prospectos
 *
 * Endpoints:
 * - POST /n8n/prospectos - Crear prospecto
 * - GET /n8n/prospectos/:telefono - Buscar por teléfono
 * - PUT /n8n/prospectos/:id - Actualizar prospecto
 * - GET /n8n/prospectos/sperant/:sperant_uuid - Buscar por sperant_uuid
 */

const { Prospecto, Chat, Usuario } = require('../models/sequelize');
const usuarioRepository = require('../repositories/usuario.repository');
const chatRepository = require('../repositories/chat.repository');
const logger = require('../config/logger/loggerClient');

/**
 * Formatea número de teléfono
 */
function formatearTelefono(phone) {
  if (!phone) return '';
  let formatted = phone.toString().replace(/[\s\-\(\)\+]/g, '');
  if (formatted.startsWith('0')) {
    formatted = formatted.substring(1);
  }
  return formatted;
}

class N8nProspectoController {

  /**
   * POST /n8n/prospectos
   * Crear nuevo prospecto (o retorna existente si ya existe el teléfono)
   */
  async crear(req, res) {
    try {
      const {
        telefono,
        nombre_completo = 'Sin registrar',
        id_empresa,
        id_estado_prospecto = 1,
        dni = null,
        direccion = null,
        email = null,
        crear_chat = true
      } = req.body;

      if (!telefono || !id_empresa) {
        return res.status(400).json({
          success: false,
          error: 'telefono e id_empresa son requeridos'
        });
      }

      const telefonoFormateado = formatearTelefono(telefono);

      // Verificar si ya existe
      let prospecto = await Prospecto.findOne({
        where: {
          celular: telefonoFormateado,
          id_empresa,
          estado_registro: 1
        }
      });

      if (prospecto) {
        // Retornar prospecto existente
        let chat = null;
        if (crear_chat) {
          chat = await chatRepository.findByProspecto(prospecto.id);
        }

        return res.json({
          success: true,
          creado: false,
          prospecto: {
            id: prospecto.id,
            nombre_completo: prospecto.nombre_completo,
            celular: prospecto.celular,
            id_empresa: prospecto.id_empresa,
            id_usuario: prospecto.id_usuario,
            id_estado_prospecto: prospecto.id_estado_prospecto
          },
          chat: chat ? { id: chat.id } : null
        });
      }

      // Asignación round-robin de asesor (rol 3)
      const asesores = await usuarioRepository.findByRol(3, id_empresa);
      const ids = asesores.map(a => a.id);
      let id_asesor = ids.length > 0 ? ids[0] : null;

      // Crear prospecto
      prospecto = await Prospecto.create({
        celular: telefonoFormateado,
        nombre_completo,
        id_empresa,
        id_estado_prospecto,
        id_usuario: id_asesor,
        dni,
        direccion,
        email,
        usuario_registro: null,
        estado_registro: 1
      });

      logger.info(`[n8nProspecto] Creado: ${prospecto.id} - ${telefonoFormateado}`);

      // Crear chat si se solicita
      let chat = null;
      if (crear_chat) {
        chat = await Chat.create({
          id_prospecto: prospecto.id,
          usuario_registro: null,
          estado_registro: 1
        });
        logger.info(`[n8nProspecto] Chat creado: ${chat.id}`);
      }

      return res.json({
        success: true,
        creado: true,
        prospecto: {
          id: prospecto.id,
          nombre_completo: prospecto.nombre_completo,
          celular: prospecto.celular,
          id_empresa: prospecto.id_empresa,
          id_usuario: prospecto.id_usuario,
          id_estado_prospecto: prospecto.id_estado_prospecto
        },
        chat: chat ? { id: chat.id } : null
      });

    } catch (error) {
      logger.error(`[n8nProspecto] Error crear: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/prospectos/:telefono
   * Buscar prospecto por teléfono
   */
  async buscarPorTelefono(req, res) {
    try {
      const { telefono } = req.params;
      const { id_empresa } = req.query;

      if (!telefono) {
        return res.status(400).json({
          success: false,
          error: 'telefono es requerido'
        });
      }

      const telefonoFormateado = formatearTelefono(telefono);

      const whereClause = {
        celular: telefonoFormateado,
        estado_registro: 1
      };

      if (id_empresa) {
        whereClause.id_empresa = parseInt(id_empresa);
      }

      const prospecto = await Prospecto.findOne({
        where: whereClause,
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario', 'email'] }
        ]
      });

      if (!prospecto) {
        return res.status(404).json({
          success: false,
          error: 'Prospecto no encontrado'
        });
      }

      const chat = await chatRepository.findByProspecto(prospecto.id);

      return res.json({
        success: true,
        prospecto: {
          id: prospecto.id,
          nombre_completo: prospecto.nombre_completo,
          celular: prospecto.celular,
          dni: prospecto.dni,
          email: prospecto.email,
          direccion: prospecto.direccion,
          id_empresa: prospecto.id_empresa,
          id_usuario: prospecto.id_usuario,
          id_estado_prospecto: prospecto.id_estado_prospecto,
          asesor: prospecto.usuario ? {
            id: prospecto.usuario.id,
            nombre: prospecto.usuario.usuario
          } : null
        },
        chat: chat ? { id: chat.id } : null
      });

    } catch (error) {
      logger.error(`[n8nProspecto] Error buscarPorTelefono: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /n8n/prospectos/:id
   * Actualizar prospecto
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre_completo,
        dni,
        email,
        direccion,
        id_estado_prospecto,
        id_usuario
      } = req.body;

      const prospecto = await Prospecto.findByPk(id);
      if (!prospecto) {
        return res.status(404).json({
          success: false,
          error: 'Prospecto no encontrado'
        });
      }

      const datosActualizar = {};
      if (nombre_completo !== undefined) datosActualizar.nombre_completo = nombre_completo;
      if (dni !== undefined) datosActualizar.dni = dni;
      if (email !== undefined) datosActualizar.email = email;
      if (direccion !== undefined) datosActualizar.direccion = direccion;
      if (id_estado_prospecto !== undefined) datosActualizar.id_estado_prospecto = id_estado_prospecto;
      if (id_usuario !== undefined) datosActualizar.id_usuario = id_usuario;

      await Prospecto.update(datosActualizar, { where: { id } });

      const prospectoActualizado = await Prospecto.findByPk(id);

      logger.info(`[n8nProspecto] Actualizado: ${id}`);

      return res.json({
        success: true,
        prospecto: {
          id: prospectoActualizado.id,
          nombre_completo: prospectoActualizado.nombre_completo,
          celular: prospectoActualizado.celular,
          dni: prospectoActualizado.dni,
          email: prospectoActualizado.email,
          id_estado_prospecto: prospectoActualizado.id_estado_prospecto,
          id_usuario: prospectoActualizado.id_usuario
        }
      });

    } catch (error) {
      logger.error(`[n8nProspecto] Error actualizar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/prospectos/sperant/:sperant_uuid
   * Buscar prospecto por sperant_uuid
   */
  async buscarPorSperantUuid(req, res) {
    try {
      const { sperant_uuid } = req.params;

      if (!sperant_uuid) {
        return res.status(400).json({
          success: false,
          error: 'sperant_uuid es requerido'
        });
      }

      const prospecto = await Prospecto.findOne({
        where: {
          sperant_uuid: sperant_uuid,
          estado_registro: 1
        },
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario', 'email'] }
        ]
      });

      if (!prospecto) {
        return res.status(404).json({
          success: false,
          error: 'Prospecto no encontrado'
        });
      }

      const chat = await chatRepository.findByProspecto(prospecto.id);

      return res.json({
        success: true,
        prospecto: {
          id: prospecto.id,
          nombre_completo: prospecto.nombre_completo,
          celular: prospecto.celular,
          dni: prospecto.dni,
          email: prospecto.email,
          direccion: prospecto.direccion,
          sperant_uuid: prospecto.sperant_uuid,
          id_empresa: prospecto.id_empresa,
          id_usuario: prospecto.id_usuario,
          id_estado_prospecto: prospecto.id_estado_prospecto,
          asesor: prospecto.usuario ? {
            id: prospecto.usuario.id,
            nombre: prospecto.usuario.usuario
          } : null
        },
        chat: chat ? { id: chat.id } : null
      });

    } catch (error) {
      logger.error(`[n8nProspecto] Error buscarPorSperantUuid: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nProspectoController();
