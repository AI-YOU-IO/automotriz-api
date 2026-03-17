const { CampaniaProspectos } = require("../models/sequelize");

class CampaniaProspectosRepository {
  async findAll() {
    return CampaniaProspectos.findAll({
      where: { estado_registro: 1 }
    });
  }

  async findById(id) {
    return CampaniaProspectos.findByPk(id);
  }

  async create(data) {
    return CampaniaProspectos.create(data);
  }

  async update(id, data) {
    return CampaniaProspectos.update(data, { where: { id } });
  }

  async delete(id) {
    return CampaniaProspectos.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new CampaniaProspectosRepository();
