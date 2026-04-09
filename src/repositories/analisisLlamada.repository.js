const { AnalisisLlamada } = require("../models/sequelize");

class AnalisisLlamadaRepository {
  async create(data) {
    return AnalisisLlamada.create(data);
  }

  async findByLlamadaId(idLlamada) {
    return AnalisisLlamada.findOne({
      where: { id_llamada: idLlamada, estado_registro: 1 }
    });
  }
}

module.exports = new AnalisisLlamadaRepository();
