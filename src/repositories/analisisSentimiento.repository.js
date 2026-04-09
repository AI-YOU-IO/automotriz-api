const { AnalisisSentimiento } = require("../models/sequelize");

class AnalisisSentimientoRepository {
  async create(data) {
    return AnalisisSentimiento.create(data);
  }

  async findByLlamadaId(idLlamada) {
    return AnalisisSentimiento.findOne({
      where: { id_llamada: idLlamada, estado_registro: 1 }
    });
  }
}

module.exports = new AnalisisSentimientoRepository();
