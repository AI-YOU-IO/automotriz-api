const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const AnalisisLlamada = sequelize.define('AnalisisLlamada', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_llamada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'llamada',
        key: 'id'
      }
    },
    total_tokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    total_palabras: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    tiempo_habla_seg: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    tiempo_silencio_seg: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    cumplimiento_protocolo: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null
    },
    fcr: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
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
    tableName: 'analisis_llamada',
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

  AnalisisLlamada.associate = (models) => {
    AnalisisLlamada.belongsTo(models.Llamada, { foreignKey: 'id_llamada', as: 'llamada' });
    AnalisisLlamada.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return AnalisisLlamada;
};
