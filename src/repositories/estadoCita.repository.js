const { EstadoCita } = require("../models/sequelize");

class EstadoCitaRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return EstadoCita.findAll({
      where: whereClause,
      order: [['orden', 'ASC'], ['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return EstadoCita.findByPk(id);
  }

  async create(data) {
    return EstadoCita.create(data);
  }

  async update(id, data) {
    return EstadoCita.update(data, { where: { id } });
  }

  async delete(id) {
    return EstadoCita.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new EstadoCitaRepository();
