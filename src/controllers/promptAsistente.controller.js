const logger = require('../config/logger/loggerClient.js');
const { Plantilla } = require('../models/sequelize');

class PromptAsistenteController {
  async getPrompt(req, res) {
    try {
      const idEmpresa = req.user?.idEmpresa || null;

      if (!idEmpresa) {
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      const plantilla = await Plantilla.findOne({
        where: { id_empresa: idEmpresa, estado_registro: 1 },
        attributes: ['id', 'id_empresa', 'prompt_sistema']
      });

      return res.status(200).json({ data: plantilla });
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

      let plantilla = await Plantilla.findOne({
        where: { id_empresa: idEmpresa, estado_registro: 1 }
      });

      if (plantilla) {
        await plantilla.update({ prompt_sistema });
        return res.status(200).json({
          msg: "Prompt actualizado exitosamente",
          data: { id: plantilla.id }
        });
      } else {
        plantilla = await Plantilla.create({
          nombre: 'Prompt Asistente',
          prompt_sistema,
          id_empresa: idEmpresa,
          id_formato: 1,
          usuario_registro
        });
        return res.status(200).json({
          msg: "Prompt creado exitosamente",
          data: { id: plantilla.id }
        });
      }
    } catch (error) {
      logger.error(`[promptAsistente.controller.js] Error al guardar prompt asistente: ${error.message}`);
      return res.status(500).json({ msg: "Error al guardar prompt asistente" });
    }
  }
}

module.exports = new PromptAsistenteController();
