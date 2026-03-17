const { PlantillaWhatsapp } = require("../models/sequelize");

class PlantillaWhatsappRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return PlantillaWhatsapp.findAll({
      where: whereClause,
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findById(id) {
    return PlantillaWhatsapp.findByPk(id);
  }

  async findByName(name, idEmpresa) {
    return PlantillaWhatsapp.findOne({
      where: { name, id_empresa: idEmpresa, estado_registro: 1 }
    });
  }

  async findByMetaTemplateId(metaTemplateId, idEmpresa) {
    const whereClause = { meta_template_id: metaTemplateId, estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;
    return PlantillaWhatsapp.findOne({ where: whereClause });
  }

  async deleteByName(name, idEmpresa) {
    return PlantillaWhatsapp.update(
      { estado_registro: 0 },
      { where: { name, id_empresa: idEmpresa } }
    );
  }

  async create(data) {
    return PlantillaWhatsapp.create(data);
  }

  async update(id, data) {
    return PlantillaWhatsapp.update(data, { where: { id } });
  }

  async delete(id) {
    return PlantillaWhatsapp.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new PlantillaWhatsappRepository();
