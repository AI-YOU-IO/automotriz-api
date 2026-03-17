const { Rol, Modulo, RolModulo } = require("../models/sequelize");

class RolRepository {
  async findAll() {
    return Rol.findAll({
      where: { estado_registro: 1 },
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Rol.findByPk(id);
  }

  async findModulosByRol(idRol) {
    return Modulo.findAll({
      include: [{
        model: RolModulo,
        as: 'rolModulos',
        where: { id_rol: idRol },
        attributes: []
      }],
      attributes: ['id', 'nombre', 'url', 'icono']
    });
  }

  async create({ nombre, descripcion }) {
    return Rol.create({ nombre, descripcion });
  }

  async assignModulos(idRol, modulos) {
    const rolModulos = modulos.map(id_modulo => ({ id_rol: idRol, id_modulo }));
    return RolModulo.bulkCreate(rolModulos);
  }

  async update(id, { nombre, descripcion }) {
    return Rol.update({ nombre, descripcion }, { where: { id } });
  }

  async removeAllModulos(idRol) {
    return RolModulo.update({ estado_registro: 0 }, { where: { id_rol: idRol, estado_registro: 1 } });
  }

  async delete(id) {
    return Rol.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new RolRepository();
