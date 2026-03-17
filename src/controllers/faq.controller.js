// const faqRepository = require("../repositories/faq.repository.js");
const faqVectorService = require('../services/faq/faqVector.service.js');
const logger = require('../config/logger/loggerClient.js');

class FaqController {
  async getFaqs(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const faqs = await faqVectorService.getAll(idEmpresa);
      return res.status(200).json({ data: faqs });
    } catch (error) {
      logger.error(`[faq.controller.js] Error al obtener FAQs: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener preguntas frecuentes" });
    }
  }

  async createFaq(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { pregunta, respuesta } = req.body;

      if (!pregunta || !respuesta) {
        return res.status(400).json({ msg: "La pregunta y respuesta son requeridas" });
      }

      const faq = await faqVectorService.create({ id_empresa: idEmpresa, pregunta, respuesta });

      return res.status(201).json({ msg: "Pregunta frecuente creada exitosamente", data: { id: faq.id } });
    } catch (error) {
      logger.error(`[faq.controller.js] Error al crear FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear pregunta frecuente" });
    }
  }

  async updateFaq(req, res) {
    try {
      const { id } = req.params;
      const { pregunta, respuesta } = req.body;

      if (!pregunta || !respuesta) {
        return res.status(400).json({ msg: "La pregunta y respuesta son requeridas" });
      }

      await faqVectorService.update(id, { pregunta, respuesta });

      return res.status(200).json({ msg: "Pregunta frecuente actualizada exitosamente" });
    } catch (error) {
      logger.error(`[faq.controller.js] Error al actualizar FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar pregunta frecuente" });
    }
  }

  async deleteFaq(req, res) {
    try {
      const { id } = req.params;
      await faqVectorService.delete(id);
      return res.status(200).json({ msg: "Pregunta frecuente eliminada exitosamente" });
    } catch (error) {
      logger.error(`[faq.controller.js] Error al eliminar FAQ: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar pregunta frecuente" });
    }
  }
}

module.exports = new FaqController();
