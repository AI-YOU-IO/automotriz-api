const { EnvioMasivoWhatsapp, PlantillaWhatsapp, EnviosProspectos, Prospecto } = require("../models/sequelize");

class EnvioMasivoWhatsappRepository {
  async findAll(idEmpresa) {
    return EnvioMasivoWhatsapp.findAll({
      where: { estado_registro: 1, id_empresa: idEmpresa },
      include: [
        { model: PlantillaWhatsapp, as: 'plantilla' }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return EnvioMasivoWhatsapp.findByPk(id, {
      include: [
        { model: PlantillaWhatsapp, as: 'plantilla' },
        {
          model: EnviosProspectos,
          as: 'enviosProspectos',
          include: [{ model: Prospecto, as: 'prospecto' }]
        }
      ]
    });
  }

  async create(data) {
    return EnvioMasivoWhatsapp.create(data);
  }

  async update(id, data) {
    return EnvioMasivoWhatsapp.update(data, { where: { id } });
  }

  async delete(id) {
    return EnvioMasivoWhatsapp.update({ estado_registro: 0 }, { where: { id } });
  }

  async updateContadores(id, cantidadExitosos, cantidadFallidos) {
    return EnvioMasivoWhatsapp.update(
      { cantidad_exitosos: cantidadExitosos, cantidad_fallidos: cantidadFallidos },
      { where: { id } }
    );
  }
}

module.exports = new EnvioMasivoWhatsappRepository();
