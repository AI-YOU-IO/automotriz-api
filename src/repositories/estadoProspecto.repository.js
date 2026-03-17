const { EstadoProspecto } = require("../models/sequelize");

class EstadoProspectoRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return EstadoProspecto.findAll({
      where: whereClause,
      order: [['orden', 'ASC'], ['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return EstadoProspecto.findByPk(id);
  }

  async create(data) {
    return EstadoProspecto.create(data);
  }

  async update(id, data) {
    return EstadoProspecto.update(data, { where: { id } });
  }

  async delete(id) {
    return EstadoProspecto.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new EstadoProspectoRepository();
