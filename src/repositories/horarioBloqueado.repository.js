const { HorarioBloqueado } = require("../models/sequelize");

class HorarioBloqueadoRepository {
  async findByEmpresa(idEmpresa) {
    return HorarioBloqueado.findOne({
      where: { id_empresa: idEmpresa, estado_registro: 1 }
    });
  }

  async findById(id) {
    return HorarioBloqueado.findOne({
      where: { id, estado_registro: 1 }
    });
  }

  async create(data) {
    return HorarioBloqueado.create(data);
  }

  async update(id, data) {
    return HorarioBloqueado.update(data, {
      where: { id }
    });
  }

  async upsertByEmpresa(idEmpresa, data, usuarioActualizacion) {
    const existing = await this.findByEmpresa(idEmpresa);

    if (existing) {
      await HorarioBloqueado.update(
        { ...data, usuario_actualizacion: usuarioActualizacion },
        { where: { id: existing.id } }
      );
      return this.findByEmpresa(idEmpresa);
    }

    return HorarioBloqueado.create({
      ...data,
      id_empresa: idEmpresa,
      usuario_registro: usuarioActualizacion,
      usuario_actualizacion: usuarioActualizacion
    });
  }

  async delete(id, usuarioActualizacion) {
    return HorarioBloqueado.update(
      { estado_registro: 0, usuario_actualizacion: usuarioActualizacion },
      { where: { id } }
    );
  }
}

module.exports = new HorarioBloqueadoRepository();
