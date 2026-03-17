const { EnviosProspectos, Prospecto } = require("../models/sequelize");

class EnviosProspectosRepository {
  async findAll(idEnvioMasivo) {
    return EnviosProspectos.findAll({
      where: { estado_registro: 1, id_envio_masivo: idEnvioMasivo },
      include: [
        { model: Prospecto, as: 'prospecto' }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return EnviosProspectos.findByPk(id, {
      include: [
        { model: Prospecto, as: 'prospecto' }
      ]
    });
  }

  async findByEnvioAndProspecto(idEnvioMasivo, idProspecto) {
    return EnviosProspectos.findOne({
      where: { id_envio_masivo: idEnvioMasivo, id_prospecto: idProspecto, estado_registro: 1 }
    });
  }

  async create(data) {
    return EnviosProspectos.create(data);
  }

  async bulkCreate(dataArray) {
    return EnviosProspectos.bulkCreate(dataArray);
  }

  async update(id, data) {
    return EnviosProspectos.update(data, { where: { id } });
  }

  async delete(id) {
    return EnviosProspectos.update({ estado_registro: 0 }, { where: { id } });
  }

  async deleteByEnvioId(idEnvioMasivo) {
    return EnviosProspectos.update(
      { estado_registro: 0 },
      { where: { id_envio_masivo: idEnvioMasivo } }
    );
  }


  async updateEstado(id, estado, errorMensaje = null) {
    const updateData = { estado, fecha_envio: new Date() };
    if (errorMensaje) {
      updateData.error_mensaje = errorMensaje;
    }
    return EnviosProspectos.update(updateData, { where: { id } });
  }

  async countByEstado(idEnvioMasivo) {
    const exitosos = await EnviosProspectos.count({
      where: { id_envio_masivo: idEnvioMasivo, estado: 'completado', estado_registro: 1 }
    });
    const fallidos = await EnviosProspectos.count({
      where: { id_envio_masivo: idEnvioMasivo, estado: 'fallido', estado_registro: 1 }
    });
    return { exitosos, fallidos };
  }
}

module.exports = new EnviosProspectosRepository();
