const { Tipologia } = require("../models/sequelize");

class TipologiaRepository {
  async findAll() {
    return Tipologia.findAll({
      where: { estado_registro: 1 },
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Tipologia.findByPk(id);
  }

  async create(data) {
    return Tipologia.create(data);
  }

  async update(id, data) {
    return Tipologia.update(data, { where: { id } });
  }

  async delete(id) {
    return Tipologia.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new TipologiaRepository();
