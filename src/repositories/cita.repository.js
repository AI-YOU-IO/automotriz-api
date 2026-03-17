const { Cita, Prospecto, Proyecto, Unidad, EstadoCita, Usuario, Tipologia } = require("../models/sequelize");

class CitaRepository {
  async findAll() {
    return Cita.findAll({
      where: { estado_registro: 1 },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo'], required: false },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Unidad, as: 'unidad', attributes: ['id', 'nombre'], required: false,
          include: [{ model: Tipologia, as: 'tipologia', attributes: ['id', 'nombre'], required: false }]
        },
        { model: EstadoCita, as: 'estadoCita', attributes: ['id', 'nombre', 'color'], required: false },
        { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'], required: false }
      ],
      order: [['hora_inicio', 'DESC']]
    });
  }

  async findById(id) {
    return Cita.findByPk(id, {
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo'], required: false },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'nombre'], required: false },
        { model: Unidad, as: 'unidad', attributes: ['id', 'nombre'], required: false,
          include: [{ model: Tipologia, as: 'tipologia', attributes: ['id', 'nombre'], required: false }]
        },
        { model: EstadoCita, as: 'estadoCita', attributes: ['id', 'nombre', 'color'], required: false },
        { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'], required: false }
      ]
    });
  }

  async findByProspecto(idProspecto) {
    return Cita.findAll({
      where: { estado_registro: 1, id_prospecto: idProspecto },
      order: [['hora_inicio', 'DESC']]
    });
  }

  async create(data) {
    if (!data.usuario_registro) {
      data.usuario_registro = null;
    }
    data.usuario_actualizacion = data.usuario_registro || null;
    
    return Cita.create(data);
  }

  async update(id, data) {
    return Cita.update(data, { where: { id } });
  }

  async delete(id) {
    return Cita.update({ estado_registro: 0 }, { where: { id } });
  }

  async findHorariosOcupados(idUsuario) {
    return Cita.findAll({
      where: {
        estado_registro: 1,
        id_usuario: idUsuario,
      },
      attributes: ["id", "hora_inicio", "hora_fin"],
      order: [["hora_inicio", "ASC"]],
    });
  }
}

module.exports = new CitaRepository();
