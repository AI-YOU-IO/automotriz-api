const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Tool = sequelize.define('Tool', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ruta: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    extra_fields: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    ...commonFields
  }, {
    tableName: 'tool',
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

  return Tool;
};
