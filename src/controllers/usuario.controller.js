const usuarioRepository = require("../repositories/usuario.repository.js");
const logger = require('../config/logger/loggerClient.js');
const bcrypt = require('bcrypt');

class UsuarioController {

  async getUsuarios(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const usuarios = await usuarioRepository.findAll(idEmpresa);
      return res.status(200).json({ data: usuarios });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al obtener usuarios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuarios" });
    }
  }

  async getUsuarioById(req, res) {
    try {
      const { id } = req.params;
      const usuario = await usuarioRepository.findById(id);

      if (!usuario) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }

      return res.status(200).json({ data: usuario });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al obtener usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuario" });
    }
  }

  async createUsuario(req, res) {
    try {
      const { id_rol, usuario: nombreUsuario, email, password, id_sucursal, id_padre, id_empresa } = req.body;

      if (!nombreUsuario || !password || !id_rol || !email) {
        return res.status(400).json({ msg: "Usuario, email, password y rol son requeridos" });
      }

      const exists = await usuarioRepository.findByUsername(nombreUsuario);
      if (exists) {
        return res.status(400).json({ msg: "El usuario ya existe" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const usuario = await usuarioRepository.create({
        id_rol: Number(id_rol),
        usuario: nombreUsuario,
        email,
        password: hashedPassword,
        id_sucursal: id_sucursal ? Number(id_sucursal) : null,
        id_padre: id_padre ? Number(id_padre) : null,
        id_empresa: Number(id_empresa || req.user?.idEmpresa),
        usuario_registro: req.user?.userId
      });

      return res.status(201).json({ msg: "Usuario creado exitosamente", data: { id: usuario.id } });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al crear usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear usuario" });
    }
  }

  async updateUsuario(req, res) {
    try {
      const { id } = req.params;
      const { id_rol, usuario: nombreUsuario, email, password, id_sucursal, id_padre } = req.body;

      if (!nombreUsuario || !id_rol) {
        return res.status(400).json({ msg: "Usuario y rol son requeridos" });
      }

      const exists = await usuarioRepository.findByUsernameExcluding(nombreUsuario, id);
      if (exists) {
        return res.status(400).json({ msg: "El usuario ya existe" });
      }

      const updateData = { id_rol: Number(id_rol), usuario: nombreUsuario, email, id_sucursal: id_sucursal ? Number(id_sucursal) : null, id_padre: id_padre ? Number(id_padre) : null, usuario_actualizacion: req.user?.userId };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await usuarioRepository.update(id, updateData);

      return res.status(200).json({ msg: "Usuario actualizado exitosamente" });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al actualizar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar usuario" });
    }
  }

  async deleteUsuario(req, res) {
    try {
      const { id } = req.params;
      await usuarioRepository.delete(id);
      return res.status(200).json({ msg: "Usuario eliminado exitosamente" });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al eliminar usuario: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar usuario" });
    }
  }

  async getUsuariosByRol(req, res) {
    try {
      const { idRol } = req.params;
      const { idEmpresa } = req.user || {};
      const usuarios = await usuarioRepository.findByRol(idRol, idEmpresa);
      return res.status(200).json({ data: usuarios });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al obtener usuarios por rol: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener usuarios por rol" });
    }
  }

  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: "La contraseña actual y nueva son requeridas" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ msg: "La nueva contraseña debe tener al menos 6 caracteres" });
      }

      const usuario = await usuarioRepository.findByIdWithPassword(id);
      if (!usuario) {
        return res.status(400).json({ msg: "Usuario no encontrado" });
      }

      const isMatch = await bcrypt.compare(currentPassword, usuario.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "La contraseña actual es incorrecta" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await usuarioRepository.updatePassword(id, hashedNewPassword);

      return res.status(200).json({ msg: "Contraseña actualizada exitosamente" });
    } catch (error) {
      logger.error(`[usuario.controller.js] Error al cambiar contraseña: ${error.message}`);
      return res.status(500).json({ msg: "Error al cambiar la contraseña" });
    }
  }
}

module.exports = new UsuarioController();