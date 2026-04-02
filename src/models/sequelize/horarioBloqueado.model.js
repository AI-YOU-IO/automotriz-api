const { DataTypes } = require('sequelize');
const { commonFields, commonOptions, createDefaultScopes } = require('../base/baseModel');

module.exports = (sequelize) => {
  const HorarioBloqueado = sequelize.define('HorarioBloqueado', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'empresa', key: 'id' }
    },
    horario_lunes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    horario_martes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    horario_miercoles: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    horario_jueves: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    horario_viernes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    horario_sabado: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    horario_domingo: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    ...commonFields
  }, {
    tableName: 'horario_bloqueado',
    ...commonOptions,
    ...createDefaultScopes()
  });

  HorarioBloqueado.associate = (models) => {
    HorarioBloqueado.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return HorarioBloqueado;
};
