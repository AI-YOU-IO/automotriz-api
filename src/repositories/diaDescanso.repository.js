const { DiaDescanso } = require("../models/sequelize");

class DiaDescansoRepository {
  async findAll() {
    return DiaDescanso.findAll({
      where: { estado_registro: 1 },
      order: [["fecha_descanso", "ASC"]],
    });
  }

  async findById(id) {
    return DiaDescanso.findByPk(id);
  }

  async findByUsuario(idUsuario) {
    return DiaDescanso.findAll({
      where: { estado_registro: 1, id_usuario: idUsuario },
      order: [["fecha_descanso", "ASC"]],
    });
  }

  async findByUsuarioAndDay(idUsuario, fecha_descanso) {
    return DiaDescanso.findAll({
      where: { estado_registro: 1, id_usuario: idUsuario, fecha_descanso },
    });
  }

  async syncByUsuario(idUsuario, fechas, usuarioRegistro) {
    // Eliminar duplicados del array de fechas
    const fechasUnicas = [...new Set(fechas)];

    // Obtener todos los registros existentes (activos e inactivos) para este usuario
    const existentes = await DiaDescanso.scope('withDeleted').findAll({
      where: { id_usuario: idUsuario },
    });

    const existentesPorFecha = {};
    existentes.forEach(reg => {
      const key = reg.fecha_descanso instanceof Date
        ? reg.fecha_descanso.toISOString().split('T')[0]
        : String(reg.fecha_descanso);
      existentesPorFecha[key] = reg;
    });

    // Desactivar los días que ya no están seleccionados
    for (const reg of existentes) {
      const key = reg.fecha_descanso instanceof Date
        ? reg.fecha_descanso.toISOString().split('T')[0]
        : String(reg.fecha_descanso);
      if (!fechasUnicas.includes(key) && reg.estado_registro === 1) {
        await DiaDescanso.update(
          { estado_registro: 0, usuario_actualizacion: usuarioRegistro },
          { where: { id: reg.id } }
        );
      }
    }

    // Activar o crear los días seleccionados
    for (const fecha of fechasUnicas) {
      const existente = existentesPorFecha[fecha];
      if (existente) {
        if (existente.estado_registro !== 1) {
          await DiaDescanso.update(
            { estado_registro: 1, usuario_actualizacion: usuarioRegistro },
            { where: { id: existente.id } }
          );
        }
      } else {
        await DiaDescanso.create({
          id_usuario: idUsuario,
          fecha_descanso: fecha,
          usuario_registro: usuarioRegistro,
          usuario_actualizacion: usuarioRegistro,
        });
      }
    }
  }

  async create(data) {
    return DiaDescanso.create(data);
  }

  async update(id, data) {
    return DiaDescanso.update(data, { where: { id } });
  }

  async delete(id) {
    return DiaDescanso.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new DiaDescansoRepository();
