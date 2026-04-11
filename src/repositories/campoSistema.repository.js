const { CampoSistema } = require('../models/sequelize');

class CampoSistemaRepository {
  async findAll() {
    return CampoSistema.findAll({
      order: [['id', 'ASC']]
    });
  }
}

module.exports = new CampoSistemaRepository();
