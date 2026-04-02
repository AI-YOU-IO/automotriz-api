const { Version, Modelo, Marca } = require("../models/sequelize");

class VersionRepository {
  async findAll(idModelo) {
    const whereClause = { estado_registro: 1 };
    if (idModelo) whereClause.id_modelo = idModelo;

    return Version.findAll({
      where: whereClause,
      include: [
        { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'], include: [{ model: Marca, as: 'marca', attributes: ['id', 'nombre'] }] }
      ],
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Version.findByPk(id, {
      include: [
        { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'], include: [{ model: Marca, as: 'marca', attributes: ['id', 'nombre'] }] }
      ]
    });
  }

  async create(data) {
    return Version.create(data);
  }

  async update(id, data) {
    return Version.update(data, { where: { id } });
  }

  async delete(id) {
    return Version.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new VersionRepository();
