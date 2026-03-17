const { Distrito } = require("../models/sequelize");

class DistritoRepository {
  async findAll() {
    return Distrito.findAll({
      order: [["nombre", "ASC"]],
    });
  }

  async findById(id) {
    return Distrito.findByPk(id);
  }
}

module.exports = new DistritoRepository();
