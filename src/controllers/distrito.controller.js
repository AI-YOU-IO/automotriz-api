const distritoRepository = require("../repositories/distrito.repository.js");
const logger = require('../config/logger/loggerClient.js');

class DistritoController {
  async getDistritos(req, res) {
    try {
      const distritos = await distritoRepository.findAll();
      return res.status(200).json({ data: distritos });
    } catch (error) {
      logger.error(`[distrito.controller.js] Error al obtener distritos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener distritos" });
    }
  }

  async getDistritoById(req, res) {
    try {
      const { id } = req.params;
      const distrito = await distritoRepository.findById(id);

      if (!distrito) {
        return res.status(404).json({ msg: "Distrito no encontrado" });
      }

      return res.status(200).json({ data: distrito });
    } catch (error) {
      logger.error(`[distrito.controller.js] Error al obtener distrito: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener distrito" });
    }
  }
}

module.exports = new DistritoController();
