const { Tool } = require("../models/sequelize");
const logger = require('../config/logger/loggerClient.js');
const path = require('path');

class ToolController {
  async getTools(req, res) {
    try {
      const { tipo } = req.query;

      const whereClause = {};
      if (tipo) {
        whereClause.tipo = tipo;
      }

      const tools = await Tool.findAll({
        where: whereClause,
        attributes: ['id', 'nombre', 'descripcion', 'tipo', 'ruta'],
        order: [['nombre', 'ASC']]
      });

      return res.status(200).json({ data: tools });
    } catch (error) {
      logger.error(`[tool.controller.js] Error al obtener tools: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tools" });
    }
  }

  async getToolById(req, res) {
    try {
      const { id } = req.params;
      const tool = await Tool.findByPk(id, {
        attributes: ['id', 'nombre', 'descripcion', 'tipo', 'ruta', 'extra_fields']
      });

      if (!tool) {
        return res.status(404).json({ msg: "Tool no encontrado" });
      }

      return res.status(200).json({ data: tool });
    } catch (error) {
      logger.error(`[tool.controller.js] Error al obtener tool: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tool" });
    }
  }

  async getToolFunctions(req, res) {
    try {
      const { id } = req.params;
      const tool = await Tool.findByPk(id, {
        attributes: ['id', 'nombre', 'ruta']
      });

      logger.info(`[tool.controller.js] getToolFunctions - id: ${id}, tool: ${JSON.stringify(tool)}`);

      if (!tool) {
        return res.status(404).json({ msg: "Tool no encontrado" });
      }

      if (!tool.ruta) {
        logger.info(`[tool.controller.js] Tool sin ruta: ${tool.nombre}`);
        return res.status(200).json({ data: { nombre: tool.nombre, ruta: null, functions: [] } });
      }

      // Ruta base hardcodeada para los tools
      const TOOLS_BASE_PATH = 'services/assistant/tools';
      // Construir la ruta completa al archivo (ruta en BD solo contiene el nombre del archivo)
      const toolPath = path.resolve(__dirname, '..', TOOLS_BASE_PATH, tool.ruta);
      logger.info(`[tool.controller.js] toolPath construido: ${toolPath}`);

      try {
        // Limpiar cache para obtener datos actualizados
        delete require.cache[require.resolve(toolPath)];
        const toolModule = require(toolPath);

        // Extraer nombres y descripciones de las funciones
        const functions = (toolModule.toolDefinitions || []).map(def => ({
          name: def.function?.name || '',
          description: def.function?.description || ''
        }));

        return res.status(200).json({
          data: {
            nombre: tool.nombre,
            ruta: tool.ruta,
            functions
          }
        });
      } catch (fileError) {
        logger.error(`[tool.controller.js] Error al leer archivo de tool: ${fileError.message}`);
        return res.status(200).json({ data: { nombre: tool.nombre, ruta: tool.ruta, functions: [], error: fileError.message } });
      }
    } catch (error) {
      logger.error(`[tool.controller.js] Error al obtener funciones del tool: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener funciones del tool" });
    }
  }
}

module.exports = new ToolController();
