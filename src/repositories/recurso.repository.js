const { Recurso, TipoRecurso, Modelo } = require("../models/sequelize");
const { sequelize } = require("../config/database");

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
      order: [['orden', 'ASC'], ['fecha_registro', 'DESC']]
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

  async createBatch(items) {
    return Recurso.bulkCreate(items);
  }

  async update(id, data) {
    return Recurso.update(data, { where: { id } });
  }

  async delete(id) {
    return Recurso.update({ estado_registro: 0 }, { where: { id } });
  }

  async reorder(items) {
    const t = await sequelize.transaction();
    try {
      for (const item of items) {
        await Recurso.update(
          { es_principal: item.es_principal, orden: item.orden },
          { where: { id: item.id }, transaction: t }
        );
      }
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new RecursoRepository();
