const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const AnalisisSentimiento = sequelize.define('AnalisisSentimiento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_llamada: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'llamada',
        key: 'id'
      }
    },
    id_chat: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat',
        key: 'id'
      }
    },
    sentimiento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    score_sentimiento: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    emocion_principal: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    score_emocion: {
      type: DataTypes.FLOAT,
      allowNull: true,
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
    tableName: 'analisis_sentimiento',
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

  AnalisisSentimiento.associate = (models) => {
    AnalisisSentimiento.belongsTo(models.Llamada, { foreignKey: 'id_llamada', as: 'llamada' });
    AnalisisSentimiento.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return AnalisisSentimiento;
};
