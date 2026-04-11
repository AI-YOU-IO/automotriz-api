const { Modelo, Version, Marca, Recurso } = require("../models/sequelize");

class ModeloRepository {
  async findAll(idMarca) {
    const whereClause = { estado_registro: 1 };
    if (idMarca) whereClause.id_marca = idMarca;

    return Modelo.findAll({
      where: whereClause,
      include: [
        { model: Version, as: 'versiones', where: { estado_registro: 1 }, required: false },
        { model: Marca, as: 'marca', attributes: ['id', 'nombre'] },
        { model: Recurso, as: 'recursos', where: { estado_registro: 1 }, required: false, attributes: ['id', 'nombre', 'url', 'id_tipo_recurso', 'es_principal', 'orden', 'extra_fields'] }
      ],
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Modelo.findByPk(id, {
      include: [
        { model: Version, as: 'versiones', where: { estado_registro: 1 }, required: false },
        { model: Marca, as: 'marca', attributes: ['id', 'nombre'] },
        { model: Recurso, as: 'recursos', where: { estado_registro: 1 }, required: false, attributes: ['id', 'nombre', 'url', 'id_tipo_recurso', 'es_principal', 'orden', 'extra_fields'] }
      ]
    });
  }

  async create(data) {
    return Modelo.create(data);
  }

  async update(id, data) {
    return Modelo.update(data, { where: { id } });
  }

  async delete(id) {
    const activeVersiones = await Version.count({ where: { id_modelo: id, estado_registro: 1 } });
    if (activeVersiones > 0) {
      throw new Error('No se puede eliminar el modelo porque tiene versiones activas asociadas');
    }
    const activeRecursos = await Recurso.count({ where: { id_modelo: id, estado_registro: 1 } });
    if (activeRecursos > 0) {
      throw new Error('No se puede eliminar el modelo porque tiene recursos activos asociados');
    }
    return Modelo.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new ModeloRepository();
