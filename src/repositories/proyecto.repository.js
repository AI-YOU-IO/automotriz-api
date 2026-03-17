const { Proyecto, Distrito, Recurso, TipoRecurso, Tipologia, sequelize } = require("../models/sequelize");
const { Op } = require("sequelize");

class ProyectoRepository {
  _getImagenesIncludes() {
    return [
      {
        model: Recurso, as: 'recursos',
        attributes: ['id', 'url', 'nombre'],
        required: false,
        where: { tipo_recurso_id: 2 }
      },
      {
        model: Tipologia, as: 'tipologias',
        attributes: ['id', 'nombre'],
        required: false,
        include: [{
          model: Recurso, as: 'recursos',
          attributes: ['id', 'url', 'nombre'],
          required: false,
          where: { tipo_recurso_id: 2 }
        }]
      }
    ];
  }

  _mapImagenes(proyectos) {
    return proyectos.map(p => {
      const json = p.toJSON();
      const imagenes = [];
      // Primero imágenes directas del proyecto
      (json.recursos || []).forEach(r => imagenes.push(r.url));
      // Luego imágenes de tipologías
      (json.tipologias || []).forEach(t => {
        (t.recursos || []).forEach(r => imagenes.push(r.url));
      });
      json.imagen_principal = imagenes[0] || null;
      json.imagenes_secundarias = imagenes.slice(1);
      delete json.recursos;
      delete json.tipologias;
      return json;
    });
  }

  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    const proyectos = await Proyecto.findAll({
      where: whereClause,
      include: [
        { model: Distrito, as: 'distrito', attributes: ['id', 'nombre'] },
        ...this._getImagenesIncludes()
      ],
      order: [['nombre', 'ASC']]
    });

    return this._mapImagenes(proyectos);
  }

  async findById(id) {
    const proyecto = await Proyecto.findByPk(id, {
      include: [...this._getImagenesIncludes()]
    });
    if (!proyecto) return null;
    return this._mapImagenes([proyecto])[0];
  }

  async findByNombre(nombre, nombreDistrito = null) {
    const baseWhere = {
      estado_registro: 1,
      nombre: { [Op.iLike]: `%${nombre}%` }
    };
    const baseAttrs = ["id", "sperant_id", "estado_proyecto", "direccion", "nombre", "descripcion", "url_google_maps", "precio_desde", "descuento_hasta"];

    const baseInclude = [
      { model: Distrito, as: 'distrito', attributes: ['nombre'] },
      { model: Recurso, as: 'recursos', attributes: ['url', "nombre"], required: false },
    ];

    if (!nombreDistrito) {
      const proyectos = await Proyecto.findAll({
        attributes: baseAttrs,
        include: [{ model: Recurso, as: 'recursos', attributes: ['url', "nombre"], required: false }],
        where: baseWhere,
        order: [['nombre', 'ASC']],
        limit: 5
      });
      return proyectos;
    }

    // Buscar por nombre + distrito exacto
    const [distritos] = await sequelize.query(
      `SELECT id FROM distrito WHERE LOWER(nombre) LIKE LOWER(:nombre)`,
      { replacements: { nombre: `%${nombreDistrito}%` } }
    );
    const ids = distritos.map(d => d.id);

    if (ids.length > 0) {
      const proyectos = await Proyecto.findAll({
        attributes: baseAttrs,
        include: baseInclude,
        where: { ...baseWhere, id_distrito: { [Op.in]: ids } },
        order: [['nombre', 'ASC']],
        limit: 5
      });
      if (proyectos.length > 0) return proyectos;

      // Fallback: buscar en distritos adyacentes
      const [adyacentes] = await sequelize.query(
        `SELECT da.id_adyacente FROM distrito_adyacente da
         WHERE da.id_distrito IN (:ids)
         ORDER BY da.prioridad ASC`,
        { replacements: { ids } }
      );
      const idsAdyacentes = adyacentes.map(d => d.id_adyacente);
      if (idsAdyacentes.length > 0) {
        const proyectosAdyacentes = await Proyecto.findAll({
          attributes: baseAttrs,
          include: baseInclude,
          where: { estado_registro: 1, id_distrito: { [Op.in]: idsAdyacentes } },
          order: [['nombre', 'ASC']],
          limit: 5
        });
        if (proyectosAdyacentes.length > 0) return proyectosAdyacentes;
      }
    }
  }

  async findByDistrito(nombreDistrito) {
    const baseAttrs = ["id", "sperant_id", "descripcion", "url_google_maps", "estado_proyecto", "direccion", "nombre", "precio_desde", "descuento_hasta"];
    const baseInclude = [
      { model: Distrito, as: 'distrito', attributes: ['nombre'] },
      { model: Recurso, as: 'recursos', attributes: ['url', "nombre"], required: false },
    ];;

    const [distritos] = await sequelize.query(
      `SELECT id FROM distrito WHERE LOWER(nombre) LIKE LOWER(:nombre)`,
      { replacements: { nombre: `%${nombreDistrito}%` } }
    );
    const ids = distritos.map(d => d.id);
    if (ids.length === 0) return [];

    const proyectos = await Proyecto.findAll({
      attributes: baseAttrs,
      include: baseInclude,
      where: { estado_registro: 1, estado_proyecto: "activo", id_distrito: { [Op.in]: ids } },
      order: [['nombre', 'ASC']],
      limit: 5
    });

    if (proyectos.length > 0) return proyectos

    // Fallback: buscar proyectos en distritos adyacentes
    const [adyacentes] = await sequelize.query(
      `SELECT da.id_adyacente FROM distrito_adyacente da
       WHERE da.id_distrito IN (:ids)
       ORDER BY da.prioridad ASC`,
      { replacements: { ids } }
    );
    const idsAdyacentes = adyacentes.map(d => d.id_adyacente);
    if (idsAdyacentes.length === 0) return [];

    const proyectosAdyacentes = await Proyecto.findAll({
      attributes: baseAttrs,
      include: baseInclude,
      where: { estado_registro: 1, estado_proyecto: "activo", id_distrito: { [Op.in]: idsAdyacentes } },
      order: [['nombre', 'ASC']],
      limit: 5
    });
    return proyectosAdyacentes;
  }

  async create(data) {
    return Proyecto.create(data);
  }

  async update(id, data) {
    return Proyecto.update(data, { where: { id } });
  }

  async delete(id) {
    return Proyecto.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new ProyectoRepository();
