const { Sucursal } = require("../models/sequelize");

class SucursalRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Sucursal.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Sucursal.findByPk(id);
  }

  async create(data) {
    return Sucursal.create(data);
  }

  async update(id, data) {
    return Sucursal.update(data, { where: { id } });
  }

  async delete(id) {
    return Sucursal.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new SucursalRepository();
