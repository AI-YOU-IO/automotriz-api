const { Prospecto, Interaccion, Usuario } = require("../models/sequelize");

class ProspectoRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Prospecto.findAll({
      where: whereClause,
      order: [['nombre_completo', 'ASC']]
    });
  }

  async findById(id) {
    return Prospecto.findByPk(id);
  }

  async findByPhone(phone) {
    return Prospecto.findOne({
      where: {
        celular: phone,
        estado_registro: 1
      }
    });
  }

  async findLastAsignation() {
    return Prospecto.findOne({
      where: { estado_registro: 1 },
      attributes: ["id_usuario"],
      order: [["id_usuario", "DESC"]],
      limit: 1
    })
  }

  async create(data) {
    const prospecto = await Prospecto.create(data);
    return Prospecto.findByPk(prospecto.id, {
      include: [{
        model: Usuario,
        as: "usuario",
        attributes: ["id"]
      }]
    });
  }

  async update(id, data) {
    return Prospecto.update(data, { where: { id } });
  }

  async delete(id) {
    return Prospecto.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new ProspectoRepository();
