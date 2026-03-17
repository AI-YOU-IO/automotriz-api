const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Voz = sequelize.define('Voz', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nacionalidad: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    genero: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    voice_code: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ...commonFields
  }, {
    tableName: 'voz',
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

  return Voz;
};
