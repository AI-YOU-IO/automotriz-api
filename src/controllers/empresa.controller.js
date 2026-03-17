const empresaRepository = require("../repositories/empresa.repository.js");
const logger = require('../config/logger/loggerClient.js');

class EmpresaController {
  async getEmpresas(req, res) {
    try {
      const empresas = await empresaRepository.findAll();
      return res.status(200).json({ data: empresas });
    } catch (error) {
      logger.error(`[empresa.controller.js] Error al obtener empresas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener empresas" });
    }
  }

  async getEmpresaById(req, res) {
    try {
      const { id } = req.params;
      const empresa = await empresaRepository.findById(id);

      if (!empresa) {
        return res.status(404).json({ msg: "Empresa no encontrada" });
      }

      return res.status(200).json({ data: empresa });
    } catch (error) {
      logger.error(`[empresa.controller.js] Error al obtener empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener empresa" });
    }
  }

  async createEmpresa(req, res) {
    try {
      const { razon_social, nombre_comercial, ruc, email, telefono, direccion, logo_url } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!razon_social || !nombre_comercial || !ruc || !email || !telefono || !direccion) {
        return res.status(400).json({ msg: "Razón social, nombre comercial, RUC, email, teléfono y dirección son requeridos" });
      }

      const empresa = await empresaRepository.create({
        razon_social, nombre_comercial, ruc, email, telefono, direccion, logo_url, usuario_registro
      });

      return res.status(201).json({ msg: "Empresa creada exitosamente", data: { id: empresa.id } });
    } catch (error) {
      logger.error(`[empresa.controller.js] Error al crear empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear empresa" });
    }
  }

  async updateEmpresa(req, res) {
    try {
      const { id } = req.params;
      const { razon_social, nombre_comercial, ruc, email, telefono, direccion, logo_url } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!razon_social || !nombre_comercial || !ruc || !email || !telefono || !direccion) {
        return res.status(400).json({ msg: "Razón social, nombre comercial, RUC, email, teléfono y dirección son requeridos" });
      }

      const [updated] = await empresaRepository.update(id, {
        razon_social, nombre_comercial, ruc, email, telefono, direccion, logo_url, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Empresa no encontrada" });
      }

      return res.status(200).json({ msg: "Empresa actualizada exitosamente" });
    } catch (error) {
      logger.error(`[empresa.controller.js] Error al actualizar empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar empresa" });
    }
  }

  async deleteEmpresa(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await empresaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Empresa no encontrada" });
      }

      return res.status(200).json({ msg: "Empresa eliminada exitosamente" });
    } catch (error) {
      logger.error(`[empresa.controller.js] Error al eliminar empresa: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar empresa" });
    }
  }
}

module.exports = new EmpresaController();
