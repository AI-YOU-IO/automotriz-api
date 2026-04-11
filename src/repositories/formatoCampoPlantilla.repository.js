const { FormatoCampoPlantilla, FormatoCampo, CampoSistema } = require('../models/sequelize');

class FormatoCampoPlantillaRepository {
  async findByPlantilla(idPlantilla) {
    return FormatoCampoPlantilla.findAll({
      where: { id_plantilla: idPlantilla, estado_registro: 1 },
      include: [
        { model: FormatoCampo, as: 'formatoCampo', attributes: ['id', 'nombre_campo', 'etiqueta', 'tipo_dato'] },
        { model: CampoSistema, as: 'campoSistema', attributes: ['id', 'nombre', 'etiqueta', 'tipo_dato'] }
      ],
      order: [['orden', 'ASC']]
    });
  }

  async replaceForPlantilla(idPlantilla, mappings, userId) {
    // Soft delete existing
    await FormatoCampoPlantilla.update(
      { estado_registro: 0, usuario_actualizacion: userId },
      { where: { id_plantilla: idPlantilla } }
    );

    if (!mappings || mappings.length === 0) return [];

    // Create new ones
    const records = mappings.map(m => ({
      id_plantilla: idPlantilla,
      id_formato_campo: m.id_formato_campo || null,
      id_campo_sistema: m.id_campo_sistema || null,
      orden: m.orden,
      usuario_registro: userId,
      estado_registro: 1
    }));

    return FormatoCampoPlantilla.bulkCreate(records);
  }
}

module.exports = new FormatoCampoPlantillaRepository();
