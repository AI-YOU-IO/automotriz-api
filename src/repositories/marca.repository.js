const { Marca, Modelo, Version } = require("../models/sequelize");

class MarcaRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Marca.findAll({
      where: whereClause,
      include: [{ model: Modelo, as: 'modelos', where: { estado_registro: 1 }, required: false }],
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Marca.findByPk(id, {
      include: [{ model: Modelo, as: 'modelos', where: { estado_registro: 1 }, required: false }]
    });
  }

  async create(data) {
    return Marca.create(data);
  }

  async update(id, data) {
    return Marca.update(data, { where: { id } });
  }

  async delete(id) {
    const activeModelos = await Modelo.count({ where: { id_marca: id, estado_registro: 1 } });
    if (activeModelos > 0) {
      throw new Error('No se puede eliminar la marca porque tiene modelos activos asociados');
    }
    return Marca.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new MarcaRepository();
