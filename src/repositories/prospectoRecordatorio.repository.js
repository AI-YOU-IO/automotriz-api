const { ProspectoRecordatorio } = require("../models/sequelize");

class ProspectoRecordatorioRepository {
  async findAll() {
    return ProspectoRecordatorio.findAll({
      where: { estado_registro: 1 }
    });
  }

  async findById(id) {
    return ProspectoRecordatorio.findByPk(id);
  }

  async create(data) {
    return ProspectoRecordatorio.create(data);
  }

  async update(id, data) {
    return ProspectoRecordatorio.update(data, { where: { id } });
  }

  async delete(id) {
    return ProspectoRecordatorio.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new ProspectoRecordatorioRepository();
