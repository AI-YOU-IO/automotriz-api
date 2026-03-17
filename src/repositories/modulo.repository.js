const { Modulo } = require("../models/sequelize");

class ModuloRepository {
  async findAll() {
    return Modulo.findAll({
      where: { estado_registro: 1 },
      order: [['orden', 'ASC']]
    });
  }

  async findById(id) {
    return Modulo.findByPk(id);
  }

  async create(data) {
    return Modulo.create(data);
  }

  async update(id, data) {
    return Modulo.update(data, { where: { id } });
  }

  async delete(id) {
    return Modulo.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new ModuloRepository();
