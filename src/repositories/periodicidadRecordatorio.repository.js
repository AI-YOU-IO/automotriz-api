const { PeriodicidadRecordatorio } = require("../models/sequelize");

class PeriodicidadRecordatorioRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return PeriodicidadRecordatorio.findAll({
      where: whereClause,
      order: [['cada_horas', 'ASC']]
    });
  }

  async findById(id) {
    return PeriodicidadRecordatorio.findByPk(id);
  }

  async create(data) {
    return PeriodicidadRecordatorio.create(data);
  }

  async update(id, data) {
    return PeriodicidadRecordatorio.update(data, { where: { id } });
  }

  async delete(id) {
    return PeriodicidadRecordatorio.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new PeriodicidadRecordatorioRepository();
