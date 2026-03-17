const { MensajeVisto } = require("../models/sequelize");

class MensajeVistoRepository {
  async findAll() {
    return MensajeVisto.findAll({
      where: { estado_registro: 1 },
      order: [['fecha_visto', 'DESC']]
    });
  }

  async findById(id) {
    return MensajeVisto.findByPk(id);
  }

  async create(data) {
    return MensajeVisto.create(data);
  }

  async update(id, data) {
    return MensajeVisto.update(data, { where: { id } });
  }

  async delete(id) {
    return MensajeVisto.update({ estado_registro: 0 }, { where: { id } });
  }

  async findByMensaje(id_mensaje) {
    return MensajeVisto.findOne({
      where: { id_mensaje, estado_registro: 1 }
    });
  }

  async bulkCreate(registros) {
    return MensajeVisto.bulkCreate(registros);
  }
}

module.exports = new MensajeVistoRepository();
