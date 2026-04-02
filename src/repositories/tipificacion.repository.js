const { Tipificacion, Prospecto, Marca, Modelo, Version } = require("../models/sequelize");

class TipificacionRepository {
  async findAll() {
    return Tipificacion.findAll({
      where: { estado_registro: 1 },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular'], required: false },
        { model: Marca, as: 'marca', attributes: ['id', 'nombre'], required: false },
        { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'], required: false },
        { model: Version, as: 'version', attributes: ['id', 'nombre'], required: false }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return Tipificacion.findByPk(id, {
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular'], required: false },
        { model: Marca, as: 'marca', attributes: ['id', 'nombre'], required: false },
        { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'], required: false },
        { model: Version, as: 'version', attributes: ['id', 'nombre'], required: false }
      ]
    });
  }

  async create(data) {
    return Tipificacion.create(data);
  }

  async update(id, data) {
    return Tipificacion.update(data, { where: { id } });
  }

  async delete(id) {
    return Tipificacion.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new TipificacionRepository();
