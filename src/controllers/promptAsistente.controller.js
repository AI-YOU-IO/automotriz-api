const logger = require('../config/logger/loggerClient.js');
const { PromptAsistente } = require('../models/sequelize');
const { invalidateCache } = require('../services/assistant/promptCache.service');

class PromptAsistenteController {
  async getPrompt(req, res) {
    try {
      const idEmpresa = req.user?.idEmpresa || null;

      if (!idEmpresa) {
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      const prompt = await PromptAsistente.findOne({
        where: { id_empresa: idEmpresa, estado_registro: 1 },
        attributes: ['id', 'id_empresa', 'prompt_sistema']
      });

      return res.status(200).json({ data: prompt });
    } catch (error) {
      logger.error(`[promptAsistente.controller.js] Error al obtener prompt asistente: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener prompt asistente" });
    }
  }

  async savePrompt(req, res) {
    try {
      const idEmpresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;
      const { prompt_sistema } = req.body;

      if (!idEmpresa) {
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      if (!prompt_sistema || prompt_sistema.trim() === '') {
        return res.status(400).json({ msg: "El prompt del sistema es requerido" });
      }

      let prompt = await PromptAsistente.findOne({
        where: { id_empresa: idEmpresa, estado_registro: 1 }
      });

      if (prompt) {
        await prompt.update({
          prompt_sistema,
          usuario_actualizacion: usuario_registro
        });
        // Invalidar cache para que se use el nuevo prompt
        invalidateCache(idEmpresa);
        return res.status(200).json({
          msg: "Prompt actualizado exitosamente",
          data: { id: prompt.id }
        });
      } else {
        prompt = await PromptAsistente.create({
          prompt_sistema,
          id_empresa: idEmpresa,
          usuario_registro
        });
        // Invalidar cache para que se use el nuevo prompt
        invalidateCache(idEmpresa);
        return res.status(200).json({
          msg: "Prompt creado exitosamente",
          data: { id: prompt.id }
        });
      }
    } catch (error) {
      logger.error(`[promptAsistente.controller.js] Error al guardar prompt asistente: ${error.message}`);
      return res.status(500).json({ msg: "Error al guardar prompt asistente" });
    }
  }
}

module.exports = new PromptAsistenteController();
