const { CampaniaEjecucion } = require("../models/sequelize");

class CampaniaEjecucionRepository {
  async findAll(idCampania) {

    return CampaniaEjecucion.findAll({
      where: { id_campania: idCampania },
      order: [['fecha_programada', 'DESC']]
    });
  }

  async findById(id) {
    return CampaniaEjecucion.findByPk(id);
  }

  async create(data) {
    return CampaniaEjecucion.create(data);
  }

  async update(id, data) {
    return CampaniaEjecucion.update(data, { where: { id } });
  }

  async getEjecuciones(idCampania) {
    return CampaniaEjecucion.findAndCountAll({
      where: { id_campania: idCampania },
      group: "estado_ejecucion",
      attributes: ["estado_ejecucion"]
    })
  }

  async cancelarEjecucion(id, data) {
    return CampaniaEjecucion.update({
      estado_ejecucion: 'cancelado',
      fecha_fin: new Date(),
      mensaje_error: data.mensaje_error || 'Cancelado por el usuario',
      usuario_actualizacion: data.usuario_actualizacion
    }, {
      where: { id, estado_ejecucion: { [Op.notIn]: ['ejecutado', 'fallido', 'cancelado'] } }
    });
  }
}

module.exports = new CampaniaEjecucionRepository();
