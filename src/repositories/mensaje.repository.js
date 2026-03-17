const { Mensaje } = require("../models/sequelize");

class MensajeRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Mensaje.findAll({
      where: whereClause,
      order: [['fecha_hora', 'ASC']]
    });
  }

  async findById(id) {
    return Mensaje.findByPk(id);
  }

  async create(data) {
    return Mensaje.create(data);
  }

  async update(id, data) {
    return Mensaje.update(data, { where: { id } });
  }

  async findByChatId(chatId, limit = 10) {
    const rows = await Mensaje.findAll({
      where: { id_chat: chatId, estado_registro: 1 },
      order: [['fecha_hora', 'DESC']],
      limit,
      raw: true
    });
    return rows.reverse();
  }

  async delete(id) {
    return Mensaje.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new MensajeRepository();
