const { Speaker } = require("../models/sequelize");

class SpeakerRepository {
  async findAll() {
    return Speaker.findAll({
      where: { estado_registro: 1 },
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Speaker.findByPk(id);
  }

  async create(data) {
    return Speaker.create(data);
  }

  async update(id, data) {
    return Speaker.update(data, { where: { id } });
  }

  async delete(id) {
    return Speaker.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new SpeakerRepository();
