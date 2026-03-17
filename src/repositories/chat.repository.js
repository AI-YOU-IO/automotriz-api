const { Chat } = require("../models/sequelize");

class ChatRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Chat.findAll({
      where: whereClause,
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return Chat.findByPk(id);
  }

  async findByProspecto(idProspecto) {
    return Chat.findOne({
      where: { id_prospecto: idProspecto },
    });
  }

  async create(data) {
    return Chat.create(data);
  }

  async update(id, data) {
    return Chat.update(data, { where: { id } });
  }

  async delete(id) {
    return Chat.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new ChatRepository();
