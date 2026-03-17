const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const FormatoCampo = sequelize.define('FormatoCampo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_formato: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'formato',
        key: 'id'
      }
    },
    nombre_campo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    etiqueta: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipo_dato: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'string'
    },
    longitud: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    requerido: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unico: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    placeholder: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    ...commonFields
  }, {
    tableName: 'formato_campo',
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

  FormatoCampo.associate = (models) => {
    FormatoCampo.belongsTo(models.Formato, { foreignKey: 'id_formato', as: 'formato' });
  };

  return FormatoCampo;
};
