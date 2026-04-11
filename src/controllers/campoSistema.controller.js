const campoSistemaRepository = require('../repositories/campoSistema.repository.js');
const logger = require('../config/logger/loggerClient.js');

class CampoSistemaController {
  async getCamposSistema(req, res) {
    try {
      const campos = await campoSistemaRepository.findAll();
      return res.status(200).json({ data: campos });
    } catch (error) {
      logger.error(`[campoSistema.controller] Error al obtener campos del sistema: ${error.message}`);
      return res.status(500).json({ msg: 'Error al obtener campos del sistema' });
    }
  }
}

module.exports = new CampoSistemaController();
