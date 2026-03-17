const { RolModulo } = require("../models/sequelize");

class RolModuloRepository {
  async findAll() {
    return RolModulo.findAll({
      where: { estado_registro: 1 }
    });
  }

  async findById(id) {
    return RolModulo.findByPk(id);
  }

  async create(data) {
    return RolModulo.create(data);
  }

  async update(id, data) {
    return RolModulo.update(data, { where: { id } });
  }

  async delete(id) {
    return RolModulo.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new RolModuloRepository();
