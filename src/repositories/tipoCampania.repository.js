const { TipoCampania } = require("../models/sequelize");

class TipoCampaniaRepository {
  async findAll() {
    return TipoCampania.findAll({
      where: { estado_registro: 1 },
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return TipoCampania.findByPk(id);
  }

  async create(data) {
    return TipoCampania.create(data);
  }

  async update(id, data) {
    return TipoCampania.update(data, { where: { id } });
  }

  async delete(id) {
    return TipoCampania.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new TipoCampaniaRepository();
