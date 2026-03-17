const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const PreguntaFrecuente = sequelize.define('PreguntaFrecuente', {
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
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    contenido: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    frecuencia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
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
    tableName: 'pregunta_frecuente',
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

  PreguntaFrecuente.associate = (models) => {
    PreguntaFrecuente.belongsTo(models.Llamada, { foreignKey: 'id_llamada', as: 'llamada' });
    PreguntaFrecuente.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return PreguntaFrecuente;
};
