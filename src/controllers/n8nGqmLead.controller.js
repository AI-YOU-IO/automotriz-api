const { TablaGqmLead } = require('../models/sequelize');
const logger = require('../config/logger/loggerClient');

const SOURCE_IDS_VALIDOS = new Set(['3', '4', '7', '8']);

class N8nGqmLeadController {
  async crear(req, res) {
    try {
      const sourceId = (req.body?.source_id ?? '').toString().trim();
      const numero = (req.body?.numero ?? '').toString().trim();
      const nLead = (req.body?.n_lead ?? '').toString().trim();
      const nombre = (req.body?.nombre ?? '').toString().trim() || null;
      const marca = (req.body?.marca ?? '').toString().trim() || null;
      const modelo = (req.body?.modelo ?? '').toString().trim() || null;

      if (!sourceId || !numero || !nLead) {
        return res.status(400).json({
          success: false,
          error: 'source_id, numero y n_lead son requeridos'
        });
      }

      if (!SOURCE_IDS_VALIDOS.has(sourceId)) {
        return res.status(400).json({
          success: false,
          error: 'id source no admitido, ingrese uno valido'
        });
      }

      const registro = await TablaGqmLead.create({
        source_id: sourceId,
        numero,
        n_lead: nLead,
        nombre,
        marca,
        modelo
      });

      logger.info(`[n8nGqmLead] Creado: ${registro.id} - n_lead: ${registro.n_lead}`);

      return res.status(201).json({
        success: true,
        data: {
          id: registro.id,
          source_id: registro.source_id,
          numero: registro.numero,
          n_lead: registro.n_lead,
          nombre: registro.nombre,
          marca: registro.marca,
          modelo: registro.modelo
        }
      });
    } catch (error) {
      logger.error(`[n8nGqmLead] Error crear: ${error.message}`);

      if (error?.name === 'SequelizeUniqueConstraintError' || error?.original?.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'n_lead repetido'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error al insertar en tabla_gqm_lead'
      });
    }
  }
}

module.exports = new N8nGqmLeadController();
