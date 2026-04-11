const { FormatoCampoPlantilla } = require('../models/sequelize');
const { sequelize } = require('../models/sequelize');
const { QueryTypes } = require('sequelize');

class FormatoCampoPlantillaRepository {
  async findByPlantilla(idPlantilla) {
    return sequelize.query(`
      SELECT
        fcp.id,
        fcp.id_plantilla,
        fcp.id_formato_campo,
        fcp.id_campo_sistema,
        fcp.orden,
        fcp.constante
      FROM formato_campo_plantilla fcp
      WHERE fcp.id_plantilla = :idPlantilla
        AND fcp.estado_registro = 1
      ORDER BY fcp.orden ASC
    `, {
      replacements: { idPlantilla },
      type: QueryTypes.SELECT
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
      constante: m.constante || null,
      orden: m.orden,
      usuario_registro: userId,
      estado_registro: 1
    }));

    return FormatoCampoPlantilla.bulkCreate(records);
  }
}

module.exports = new FormatoCampoPlantillaRepository();
