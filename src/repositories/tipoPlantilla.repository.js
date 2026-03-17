const { TipoPlantilla } = require("../models/sequelize");

class TipoPlantillaRepository {
  async findAll() {
    return TipoPlantilla.findAll({
      where: { estado_registro: 1 },
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return TipoPlantilla.findByPk(id);
  }

  async create(data) {
    return TipoPlantilla.create(data);
  }

  async update(id, data) {
    return TipoPlantilla.update(data, { where: { id } });
  }

  async delete(id) {
    return TipoPlantilla.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new TipoPlantillaRepository();
