const { Llamada, Prospecto, EstadoLlamada, CampaniaEjecucion, sequelize } = require("../models/sequelize");

class LlamadaRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Llamada.findAll({
      where: whereClause,
      attributes: {
        exclude: ['archivo_llamada'],
        include: [
          [sequelize.literal('CASE WHEN "Llamada"."archivo_llamada" IS NOT NULL THEN true ELSE false END'), 'tiene_audio']
        ]
      },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'email'], required: false },
        { model: EstadoLlamada, as: 'estadoLlamada', attributes: ['id', 'nombre'], required: false }
      ],
      order: [['fecha_inicio', 'DESC']]
    });
  }

  async findById(id) {
    return Llamada.findByPk(id, {
      attributes: { exclude: ['archivo_llamada'] },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'email'], required: false },
        { model: EstadoLlamada, as: 'estadoLlamada', attributes: ['id', 'nombre'], required: false }
      ]
    });
  }

  async findAudioById(id) {
    return Llamada.findByPk(id, {
      attributes: ['id', 'archivo_llamada']
    });
  }

  async create(data) {
    return Llamada.create(data);
  }

  async update(id, data) {
    return Llamada.update(data, { where: { id } });
  }

  async delete(id) {
    return Llamada.update({ estado_registro: 0 }, { where: { id } });
  }

  async findByProviderCallId(providerCallId) {
    return Llamada.findOne({
      where: { provider_call_id: providerCallId, estado_registro: 1 },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'email'], required: false },
        { model: EstadoLlamada, as: 'estadoLlamada', attributes: ['id', 'nombre'], required: false }
      ]
    });
  }

  async findByCampaniaEjecucion(idCampaniaEjecucion) {
    return Llamada.findAll({
      where: { id_campania_ejecucion: idCampaniaEjecucion, estado_registro: 1 },
      attributes: { exclude: ['archivo_llamada'] },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'email'], required: false },
        { model: EstadoLlamada, as: 'estadoLlamada', attributes: ['id', 'nombre'], required: false }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }

  async updateMetadataUltravox(id, { id_ultravox_call, metadata_ultravox_call, fecha_fin, duracion_seg }) {
    return Llamada.update(
      { id_ultravox_call, metadata_ultravox_call, fecha_fin, duracion_seg, id_estado_llamada: 1 },
      { where: { id } }
    );
  }

  async updateAudioByProvider(providerCallId, { archivo_llamada }) {
    return Llamada.update(
      { archivo_llamada },
      { where: { provider_call_id: providerCallId } }
    );
  }
}

module.exports = new LlamadaRepository();
