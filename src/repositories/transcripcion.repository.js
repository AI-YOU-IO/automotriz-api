const { Transcripcion, Llamada } = require("../models/sequelize");

class TranscripcionRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Transcripcion.findAll({
      where: whereClause,
      order: [['fecha_registro', 'ASC']]
    });
  }

  async findById(id) {
    return Transcripcion.findByPk(id);
  }

  async create(data) {
    return Transcripcion.create(data);
  }

  async update(id, data) {
    return Transcripcion.update(data, { where: { id } });
  }

  async delete(id) {
    return Transcripcion.update({ estado_registro: 0 }, { where: { id } });
  }

  async findByLlamadaId(idLlamada) {
    return Transcripcion.findAll({
      where: { id_llamada: idLlamada, estado_registro: 1 },
      order: [['ordinal', 'ASC'], ['id', 'ASC']]
    });
  }

  async findByProviderCallId(providerCallId) {
    const llamada = await Llamada.findOne({
      where: { provider_call_id: providerCallId, estado_registro: 1 },
      attributes: ['id']
    });
    if (!llamada) return [];
    return this.findByLlamadaId(llamada.id);
  }
}

module.exports = new TranscripcionRepository();
