const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    reset_token: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reset_expiration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    id_sucursal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sucursal',
        key: 'id'
      }
    },
    id_padre: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'id'
      }
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rol',
        key: 'id'
      }
    },
    intentos_fallidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    fecha_desbloqueo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_ultimo_fallo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ...commonFields
  }, {
    tableName: 'usuario',
    ...commonOptions,
    defaultScope: {
      where: { estado_registro: 1 }
    },
    scopes: {
      withDeleted: {},
      onlyDeleted: {
        where: { estado_registro: 0 }
      }
    }
  });

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Usuario.belongsTo(models.Rol, { foreignKey: 'id_rol', as: 'rol' });
    Usuario.belongsTo(models.Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
    Usuario.belongsTo(models.Usuario, { foreignKey: 'id_padre', as: 'padre' });
    Usuario.hasMany(models.Usuario, { foreignKey: 'id_padre', as: 'subordinados' });
    Usuario.hasMany(models.Prospecto, { foreignKey: 'id_usuario', as: 'prospectos' });
    Usuario.hasMany(models.Mensaje, { foreignKey: 'id_usuario', as: 'mensajes' });
    Usuario.hasMany(models.Cita, { foreignKey: 'id_usuario', as: 'citas' });
    Usuario.hasMany(models.Interaccion, { foreignKey: 'id_usuario', as: 'interacciones' });
    Usuario.hasMany(models.DiaDescanso, { foreignKey: 'id_usuario', as: 'diasDescanso' });
  };

  return Usuario;
};
