const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Sucursal = sequelize.define('Sucursal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    definicion: {
      type: DataTypes.STRING(70),
      allowNull: true
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    color: {
      type: DataTypes.STRING(70),
      allowNull: true
    },
    flag_asesor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    flag_bot: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'sucursal',
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

  Sucursal.associate = (models) => {
    Sucursal.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Sucursal.hasMany(models.Usuario, { foreignKey: 'id_sucursal', as: 'usuarios' });
  };

  return Sucursal;
};
