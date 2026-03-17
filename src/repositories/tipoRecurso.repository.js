const { TipoRecurso } = require("../models/sequelize");

class TipoRecursoRepository {
  async findAll() {
    return TipoRecurso.findAll({
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return TipoRecurso.findByPk(id);
  }

  async create(data) {
    return TipoRecurso.create(data);
  }

  async update(id, data) {
    return TipoRecurso.update(data, { where: { id } });
  }

  async delete(id) {
    return TipoRecurso.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new TipoRecursoRepository();
