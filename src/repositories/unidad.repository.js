const { Unidad, Tipologia, Recurso } = require("../models/sequelize");

class UnidadRepository {
  async findAll() {
    return Unidad.findAll({
      where: { estado_registro: 1 },
      include: [{
        model: Tipologia,
        as: 'tipologia',
        attributes: ['id', 'nombre'],
        required: false
      }]
    });
  }

  async findById(id) {
    return Unidad.findByPk(id);
  }

  async findByProyecto(idProyecto) {
    return Unidad.findAll({
      attributes: ["id", "sperant_id", "estado_comercial", "precio", "precio_venta", "precio_comercial", "edificio"],
      where: { estado_registro: 1, estado_comercial: "disponible", id_proyecto: idProyecto },
      include: [{
        model: Tipologia,
        as: "tipologia",
        attributes: ["id", "sperant_id", "nombre", "area", "numero_banios", "numero_dormitorios", "precio_minimo"],
        required: false,
        include: [{
          model: Recurso,
          as: "recursos",
          attributes: ["url", "nombre"],
          required: false
        }]
      }],
      order: [["precio", "ASC"]],
      limit: 10,
      subQuery: false
    });
  }

  async findByDormitorios(idProyecto, numeroDormitorios) {
    return Unidad.findAll({
      attributes: ["id", "sperant_id", "estado_comercial", "precio", "precio_venta", "precio_comercial", "edificio"],
      where: { estado_registro: 1, estado_comercial: "disponible", id_proyecto: idProyecto },
      include: [{
        model: Tipologia,
        as: "tipologia",
        attributes: ["id", "sperant_id", "nombre", "area", "numero_banios", "numero_dormitorios", "precio_minimo"],
        where: { numero_dormitorios: numeroDormitorios },
        required: true,
        include: [{
          model: Recurso,
          as: "recursos",
          attributes: ["url", "nombre"],
          required: false
        }]
      }],
      order: [["precio", "ASC"]],
      subQuery: false
    });
  }

  async create(data) {
    return Unidad.create(data);
  }

  async update(id, data) {
    return Unidad.update(data, { where: { id } });
  }

  async delete(id) {
    return Unidad.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new UnidadRepository();
