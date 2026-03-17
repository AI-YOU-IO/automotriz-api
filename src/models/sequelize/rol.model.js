const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Rol = sequelize.define('Rol', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    proposito: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'rol',
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

  Rol.associate = (models) => {
    Rol.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Rol.hasMany(models.Modulo, { foreignKey: 'id_rol', as: 'modulos' });
    Rol.hasMany(models.RolModulo, { foreignKey: 'id_rol', as: 'rolModulos' });
    Rol.hasMany(models.Usuario, { foreignKey: 'id_rol', as: 'usuario' });
  };

  return Rol;
};
