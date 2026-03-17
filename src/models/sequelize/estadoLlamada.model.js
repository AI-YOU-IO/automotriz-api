const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const EstadoLlamada = sequelize.define('EstadoLlamada', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
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
    tableName: 'estado_llamada',
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

  EstadoLlamada.associate = (models) => {
    EstadoLlamada.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    EstadoLlamada.hasMany(models.Llamada, { foreignKey: 'id_estado_llamada', as: 'llamadas' });
  };

  return EstadoLlamada;
};
