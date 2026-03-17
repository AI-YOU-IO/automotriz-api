const { HorarioAtencion } = require("../models/sequelize");

class HorarioAtencionRepository {
  async findByEmpresa(idEmpresa) {
    return HorarioAtencion.findAll({
      where: { id_empresa: idEmpresa, estado_registro: 1 },
      order: [['dia_semana', 'ASC']]
    });
  }

  async updateByEmpresa(idEmpresa, horarios, usuarioActualizacion) {
    const results = [];
    for (const h of horarios) {
      const [updated] = await HorarioAtencion.update(
        {
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          activo: h.activo,
          usuario_actualizacion: usuarioActualizacion
        },
        { where: { id_empresa: idEmpresa, dia_semana: h.dia_semana } }
      );

      if (!updated) {
        const created = await HorarioAtencion.create({
          id_empresa: idEmpresa,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          activo: h.activo,
          usuario_registro: usuarioActualizacion,
          usuario_actualizacion: usuarioActualizacion
        });
        results.push(created);
      } else {
        results.push({ dia_semana: h.dia_semana, updated: true });
      }
    }
    return results;
  }
}

module.exports = new HorarioAtencionRepository();
