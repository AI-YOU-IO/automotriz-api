const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Speaker = sequelize.define('Speaker', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ...commonFields
  }, {
    tableName: 'speaker',
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

  Speaker.associate = (models) => {
    Speaker.hasMany(models.Transcripcion, { foreignKey: 'id_speaker', as: 'transcripciones' });
  };

  return Speaker;
};
