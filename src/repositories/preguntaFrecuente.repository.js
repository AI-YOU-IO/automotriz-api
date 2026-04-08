const { PreguntaFrecuente } = require("../models/sequelize");

class PreguntaFrecuenteRepository {
  async bulkCreate(dataArray) {
    return PreguntaFrecuente.bulkCreate(dataArray);
  }

  async findByLlamadaId(idLlamada) {
    return PreguntaFrecuente.findAll({
      where: { id_llamada: idLlamada, estado_registro: 1 }
    });
  }
}

module.exports = new PreguntaFrecuenteRepository();
