
const {
  Campania, CampaniaEjecucion, CampaniaProspectos, Prospecto, Plantilla, PlantillaWhatsapp,
  TipoCampania, EstadoCampania, EstadoProspecto, Llamada, EstadoLlamada,
  EnviosProspectos, EnvioMasivoWhatsapp, ConfiguracionLlamada, Voz, sequelize
} = require("../models/sequelize");

class CampaniaRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    return Campania.findAll({
      where: whereClause,
      attributes: {
        include: [
          [
            sequelize.literal(`(SELECT COUNT(*) FROM campania_ejecucion AS ce WHERE ce.id_campania = "Campania".id AND ce.estado_registro = 1)`),
            'total_ejecuciones'
          ]
        ]
      },
      include: [
        { model: Plantilla, as: 'plantilla', attributes: ['id', 'nombre'], required: false },
        { model: PlantillaWhatsapp, as: 'plantillaWhatsapp', attributes: ['id', 'name'], required: false },
        { model: TipoCampania, as: 'tipoCampania', attributes: ['id', 'nombre'], required: false },
        { model: EstadoCampania, as: 'estadoCampania', attributes: ['id', 'nombre', 'color'], required: false },
        { model: EstadoProspecto, as: 'estadoProspecto', attributes: ['id', 'nombre', 'color'], required: false },
        { model: Voz, as: 'voz', attributes: ['id', 'nacionalidad', 'genero', 'voice_code'], required: false }
      ],
      order: [['nombre', 'ASC']]
    });
  }

  async findById(id) {
    return Campania.findByPk(id, {
      include: [
        { model: Plantilla, as: 'plantilla', attributes: ['id', 'nombre'], required: false },
        { model: PlantillaWhatsapp, as: 'plantillaWhatsapp', attributes: ['id', 'name'], required: false },
        { model: TipoCampania, as: 'tipoCampania', attributes: ['id', 'nombre'], required: false },
        { model: EstadoCampania, as: 'estadoCampania', attributes: ['id', 'nombre', 'color'], required: false },
        { model: EstadoProspecto, as: 'estadoProspecto', attributes: ['id', 'nombre', 'color'], required: false },
        { model: Voz, as: 'voz', attributes: ['id', 'nacionalidad', 'genero', 'voice_code'], required: false }
      ]
    });
  }

  async create(data) {
    return Campania.create(data);
  }

  async update(id, data) {
    return Campania.update(data, { where: { id } });
  }

  async countEjecuciones(idCampania) {
    return CampaniaEjecucion.count({ where: { id_campania: idCampania, estado_registro: 1 } });
  }

  async delete(id) {
    return Campania.update({ estado_registro: 0 }, { where: { id } });
  }

  // ==================== EJECUCIONES ====================
  async findEjecucionesPaginated(idCampania, page, limit) {
    const offset = (page - 1) * limit;
    return CampaniaEjecucion.findAndCountAll({
      where: { id_campania: idCampania, estado_registro: 1 },
      order: [['fecha_registro', 'DESC']],
      limit,
      offset
    });
  }

  async createEjecucion(data) {
    return CampaniaEjecucion.create(data);
  }

  async findEjecucionById(id) {
    return CampaniaEjecucion.findByPk(id);
  }

  async updateEjecucion(id, data) {
    return CampaniaEjecucion.update(data, { where: { id } });
  }

  async cancelarEjecucion(id, data) {
    return CampaniaEjecucion.update(
      { fecha_fin: new Date(), ...data },
      { where: { id } }
    );
  }

  // ==================== CAMPANIA PROSPECTOS ====================
  async findProspectosByCampania(idCampania) {
    return CampaniaProspectos.findAll({
      where: { id_campania: idCampania, estado_registro: 1 },
      include: [
        {
          model: Prospecto,
          as: 'prospecto',
          attributes: ['id', 'nombre_completo', 'celular', 'email', 'dni'],
          required: false,
          include: [
            {
              model: Llamada,
              as: 'llamadas',
              attributes: ['id', 'fecha_inicio', 'duracion_seg', 'id_estado_llamada',
                [sequelize.literal('CASE WHEN "prospecto->llamadas"."archivo_llamada" IS NOT NULL THEN true ELSE false END'), 'tiene_audio']
              ],
              required: false,
              include: [
                { model: EstadoLlamada, as: 'estadoLlamada', attributes: ['id', 'nombre'], required: false }
              ]
            }
          ]
        }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }

  async findLlamadasByEjecucion(idEjecucion) {
    return Llamada.findAll({
      where: { id_campania_ejecucion: idEjecucion, estado_registro: 1 },
      attributes: {
        exclude: ['archivo_llamada'],
        include: [
          [sequelize.literal('CASE WHEN "Llamada"."archivo_llamada" IS NOT NULL OR "Llamada"."url_audio" IS NOT NULL THEN true ELSE false END'), 'tiene_audio']
        ]
      },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'email'], required: false },
        { model: EstadoLlamada, as: 'estadoLlamada', attributes: ['id', 'nombre'], required: false }
      ],
      order: [['fecha_inicio', 'DESC']]
    });
  }

  async addProspectosToCampania(idCampania, prospectosIds, usuarioRegistro) {
    const registros = prospectosIds.map(id_prospecto => ({
      id_campania: idCampania,
      id_prospecto,
      usuario_registro: usuarioRegistro,
      usuario_actualizacion: usuarioRegistro
    }));
    return CampaniaProspectos.bulkCreate(registros);
  }

  async removeProspectoFromCampania(id) {
    return CampaniaProspectos.update(
      { estado_registro: 0 },
      { where: { id } }
    );
  }

  // ==================== CONFIGURACION DE LLAMADAS ====================
  async findConfiguracionLlamada(idCampania) {
    return ConfiguracionLlamada.findAll({
      where: { id_campania: idCampania, estado_registro: 1 },
      order: [['id', 'ASC']]
    });
  }

  async upsertConfiguracionLlamada(idCampania, diasConfig, usuarioActualizacion) {
    const dias = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
    const results = [];

    for (const dia of dias) {
      const config = diasConfig[dia] || {};
      const [registro] = await ConfiguracionLlamada.findOrCreate({
        where: { id_campania: idCampania, dia },
        defaults: {
          activo: config.activo || 0,
          hora_inicio: config.hora_inicio || '09:00',
          hora_fin: config.hora_fin || '18:00',
          max_intentos: config.max_intentos || 3,
          usuario_registro: usuarioActualizacion
        }
      });

      await registro.update({
        activo: config.activo || 0,
        hora_inicio: config.hora_inicio || '09:00',
        hora_fin: config.hora_fin || '18:00',
        max_intentos: config.max_intentos || 3,
        usuario_actualizacion: usuarioActualizacion
      });

      results.push(registro);
    }

    return results;
  }

  // ==================== ENVIOS WHATSAPP POR EJECUCION ====================
  async findEnviosByEjecucion(idEjecucion) {
    return EnviosProspectos.findAll({
      where: { id_campania_ejecucion: idEjecucion, estado_registro: 1 },
      include: [
        { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'email'], required: false },
        { model: EnvioMasivoWhatsapp, as: 'envioMasivo', attributes: ['id', 'titulo', 'estado_envio'], required: false }
      ],
      order: [['fecha_registro', 'DESC']]
    });
  }
}

module.exports = new CampaniaRepository();
