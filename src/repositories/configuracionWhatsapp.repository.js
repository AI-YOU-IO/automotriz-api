const { ConfiguracionWhatsapp } = require("../models/sequelize");

class ConfiguracionWhatsappRepository {
  async findAll() {
    return ConfiguracionWhatsapp.findAll({
      where: { estado_registro: 1 },
      order: [['id', 'DESC']]
    });
  }

  async findById(id) {
    return ConfiguracionWhatsapp.findByPk(id);
  }

  async findByEmpresaId(id_empresa) {
    return ConfiguracionWhatsapp.findOne({
      where: { id_empresa, estado_registro: 1 }
    });
  }

  async create(data) {
    return ConfiguracionWhatsapp.create(data);
  }

  async update(id, data) {
    return ConfiguracionWhatsapp.update(data, { where: { id } });
  }

  async updateByEmpresaId(id_empresa, data) {
    return ConfiguracionWhatsapp.update(data, { where: { id_empresa } });
  }

  async delete(id) {
    return ConfiguracionWhatsapp.update({ estado_registro: 0 }, { where: { id } });
  }

  async upsertByEmpresaId(id_empresa, data) {
    const existing = await this.findByEmpresaId(id_empresa);
    if (existing) {
      await this.update(existing.id, data);
      return { ...existing.toJSON(), ...data, isNew: false };
    } else {
      const created = await this.create({ ...data, id_empresa });
      return { ...created.toJSON(), isNew: true };
    }
  }
}

module.exports = new ConfiguracionWhatsappRepository();
