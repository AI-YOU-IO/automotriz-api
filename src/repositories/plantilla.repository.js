const { Plantilla, Formato } = require("../models/sequelize");

class PlantillaRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Plantilla.findAll({
      where: whereClause,
      include: [{ model: Formato, as: 'formato', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Plantilla.findByPk(id, {
      include: [{ model: Formato, as: 'formato', attributes: ['id', 'nombre'] }]
    });
  }

  async create(data) {
    return Plantilla.create(data);
  }

  async update(id, data) {
    return Plantilla.update(data, { where: { id } });
  }

  async delete(id) {
    return Plantilla.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new PlantillaRepository();
