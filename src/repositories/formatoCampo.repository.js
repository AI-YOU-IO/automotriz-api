const { FormatoCampo } = require("../models/sequelize");

class FormatoCampoRepository {
  async findAll(idFormato) {
    return FormatoCampo.findAll({
      where: { id_formato: idFormato, estado_registro: 1 },
      order: [['orden', 'ASC']]
    });
  }

  async findById(id) {
    return FormatoCampo.findByPk(id);
  }

  async create(data) {
    return FormatoCampo.create(data);
  }

  async update(id, data) {
    return FormatoCampo.update(data, { where: { id } });
  }

  async delete(id) {
    return FormatoCampo.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new FormatoCampoRepository();
