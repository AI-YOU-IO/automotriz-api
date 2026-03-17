const { EstadoCampania } = require("../models/sequelize");

class EstadoCampaniaRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return EstadoCampania.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return EstadoCampania.findByPk(id);
  }

  async create(data) {
    return EstadoCampania.create(data);
  }

  async update(id, data) {
    return EstadoCampania.update(data, { where: { id } });
  }

  async delete(id) {
    return EstadoCampania.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new EstadoCampaniaRepository();
