const { Faq } = require("../models/sequelize");

class FaqRepository {
  async findAll(idEmpresa) {
    const whereClause = {};
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Faq.findAll({
      where: whereClause,
      order: [['numero', 'ASC']]
    });
  }

  async findById(id) {
    return Faq.findByPk(id);
  }

  async create(data) {
    return Faq.create(data);
  }

  async update(id, data) {
    return Faq.update(data, { where: { id } });
  }

  async delete(id) {
    return Faq.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new FaqRepository();
