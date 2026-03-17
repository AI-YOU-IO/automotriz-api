const { EstadoLlamada } = require("../models/sequelize");

class EstadoLlamadaRepository {
  async findAll() {
    return EstadoLlamada.findAll({
      where: { estado_registro: 1 },
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return EstadoLlamada.findByPk(id);
  }

  async create(data) {
    return EstadoLlamada.create(data);
  }

  async update(id, data) {
    return EstadoLlamada.update(data, { where: { id } });
  }

  async delete(id) {
    return EstadoLlamada.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new EstadoLlamadaRepository();
