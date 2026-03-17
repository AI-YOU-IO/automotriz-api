const configuracionWhatsappRepository = require("../repositories/configuracionWhatsapp.repository.js");
const logger = require('../config/logger/loggerClient.js');

class ConfiguracionWhatsappController {
  async getConfiguraciones(req, res) {
    try {
      const configuraciones = await configuracionWhatsappRepository.findAll();
      return res.status(200).json({ data: configuraciones });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al obtener configuraciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener configuraciones de WhatsApp" });
    }
  }

  async getConfiguracionById(req, res) {
    try {
      const { id } = req.params;
      const configuracion = await configuracionWhatsappRepository.findById(id);

      if (!configuracion) {
        return res.status(404).json({ msg: "Configuracion no encontrada" });
      }

      return res.status(200).json({ data: configuracion });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al obtener configuracion: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener configuracion de WhatsApp" });
    }
  }

  async getConfiguracionByEmpresa(req, res) {
    try {
      const { empresaId } = req.params;
      const configuracion = await configuracionWhatsappRepository.findByEmpresaId(empresaId);

      if (!configuracion) {
        return res.status(404).json({ msg: "Configuracion no encontrada para esta empresa" });
      }

      return res.status(200).json({ data: configuracion });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al obtener configuracion por empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener configuracion de WhatsApp" });
    }
  }

  async createConfiguracion(req, res) {
    try {
      const {
        id_empresa,
        app_id,
        numero_telefono_id,
        clave_secreta,
        token_whatsapp,
        waba_id,
        phone_number,
        token_expiration
      } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_empresa) {
        return res.status(400).json({ msg: "El id_empresa es requerido" });
      }

      const configuracion = await configuracionWhatsappRepository.create({
        id_empresa,
        app_id,
        numero_telefono_id,
        clave_secreta,
        token_whatsapp,
        waba_id,
        phone_number,
        token_expiration,
        usuario_registro
      });

      return res.status(201).json({ msg: "Configuracion creada exitosamente", data: { id: configuracion.id } });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al crear configuracion: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear configuracion de WhatsApp" });
    }
  }

  async updateConfiguracion(req, res) {
    try {
      const { id } = req.params;
      const {
        app_id,
        numero_telefono_id,
        clave_secreta,
        token_whatsapp,
        waba_id,
        phone_number,
        token_expiration
      } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await configuracionWhatsappRepository.update(id, {
        app_id,
        numero_telefono_id,
        clave_secreta,
        token_whatsapp,
        waba_id,
        phone_number,
        token_expiration,
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Configuracion no encontrada" });
      }

      return res.status(200).json({ msg: "Configuracion actualizada exitosamente" });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al actualizar configuracion: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar configuracion de WhatsApp" });
    }
  }

  async saveConfiguracion(req, res) {
    try {
      const {
        id_empresa,
        app_id,
        numero_telefono_id,
        clave_secreta,
        token_whatsapp,
        waba_id,
        phone_number,
        token_expiration
      } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_empresa) {
        return res.status(400).json({ msg: "El id_empresa es requerido" });
      }

      const result = await configuracionWhatsappRepository.upsertByEmpresaId(id_empresa, {
        app_id,
        numero_telefono_id,
        clave_secreta,
        token_whatsapp,
        waba_id,
        phone_number,
        token_expiration,
        usuario_registro,
        usuario_actualizacion: usuario_registro
      });

      const mensaje = result.isNew ? "Configuracion creada exitosamente" : "Configuracion actualizada exitosamente";
      return res.status(result.isNew ? 201 : 200).json({ msg: mensaje, data: { id: result.id } });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al guardar configuracion: ${error.message}`);
      return res.status(500).json({ msg: "Error al guardar configuracion de WhatsApp" });
    }
  }

  async deleteConfiguracion(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await configuracionWhatsappRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Configuracion no encontrada" });
      }

      return res.status(200).json({ msg: "Configuracion eliminada exitosamente" });
    } catch (error) {
      logger.error(`[configuracionWhatsapp.controller.js] Error al eliminar configuracion: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar configuracion de WhatsApp" });
    }
  }
}

module.exports = new ConfiguracionWhatsappController();
