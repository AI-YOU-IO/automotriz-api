const { Usuario, Rol, Sucursal, Modulo, RolModulo } = require("../models/sequelize");
const { Op } = require("sequelize");

class UsuarioRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Usuario.findAll({
      where: whereClause,
      include: [
        { model: Rol, as: 'rol', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'padre', attributes: ['id', 'usuario'], required: false }
      ],
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });
  }

  async findById(id) {
    return Usuario.findByPk(id, {
      include: [
        { model: Rol, as: 'rol', attributes: ['id', 'nombre'] },
        { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }
      ],
      attributes: { exclude: ['password'] }
    });
  }

  async findByIdWithPassword(id) {
    return Usuario.findByPk(id);
  }

  async findByCredentials(usuario, password) {
    return Usuario.findOne({
      where: { usuario, password, estado_registro: 1 },
      include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }],
      raw: false
    });
  }

  async findModulosByRol(idRol) {
    return Modulo.findAll({
      where: { id_rol: idRol },
      attributes: ['nombre', 'ruta']
    });
  }

  async findByUsername(usuario) {
    return Usuario.findOne({
      where: { usuario, estado_registro: 1 },
      include: [{ model: Rol, as: 'rol', attributes: ['id', 'nombre'] }]
    });
  }

  async findByUsernameExcluding(usuario, excludeId) {
    return Usuario.findOne({
      where: { usuario, estado_registro: 1, id: { [Op.ne]: excludeId } }
    });
  }

  async findByRol(idRol, idEmpresa) {
    return Usuario.findAll({
      where: { id_rol: idRol, id_empresa: idEmpresa, estado_registro: 1 },
      attributes: ['id', 'usuario', 'email', 'id_padre']
    });
  }

  async create(data) {
    return Usuario.create(data);
  }

  async update(id, data) {
    return Usuario.update(data, { where: { id } });
  }

  async delete(id) {
    return Usuario.update({ estado_registro: 0 }, { where: { id } });
  }

  async updatePassword(id, newPassword) {
    return Usuario.update({ password: newPassword }, { where: { id } });
  }
}

module.exports = new UsuarioRepository();
