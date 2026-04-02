const { Recurso, TipoRecurso, Modelo } = require("../models/sequelize");

class RecursoRepository {
  async findAll(empresaId) {
    const whereClause = {};
    if (empresaId) whereClause.id_empresa = empresaId;

    return Recurso.findAll({
      where: whereClause,
      include: [
        { model: TipoRecurso, as: 'tipoRecurso', attributes: ['id', 'nombre'], required: false },
        { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'], required: false }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return Recurso.findByPk(id, {
      include: [
        { model: TipoRecurso, as: 'tipoRecurso', attributes: ['id', 'nombre'], required: false },
        { model: Modelo, as: 'modelo', attributes: ['id', 'nombre'], required: false }
      ]
    });
  }

  async create(data) {
    return Recurso.create(data);
  }

  async update(id, data) {
    return Recurso.update(data, { where: { id } });
  }

  async delete(id) {
    return Recurso.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new RecursoRepository();
