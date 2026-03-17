const { Empresa } = require("../models/sequelize");

class EmpresaRepository {
  async findAll() {
    return Empresa.findAll({
      where: { estado_registro: 1 },
      order: [['nombre_comercial', 'ASC']]
    });
  }

  async findById(id) {
    return Empresa.findByPk(id);
  }

  async create(data) {
    return Empresa.create(data);
  }

  async update(id, data) {
    return Empresa.update(data, { where: { id } });
  }

  async delete(id) {
    return Empresa.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new EmpresaRepository();
