const { Interaccion } = require("../models/sequelize");

class InteraccionRepository {
  async findAll() {
    return Interaccion.findAll({
      where: { estado_registro: 1 },
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return Interaccion.findByPk(id);
  }

  async create(data) {
    return Interaccion.create(data);
  }

  async update(id, data) {
    return Interaccion.update(data, { where: { id } });
  }

  async delete(id) {
    return Interaccion.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new InteraccionRepository();
