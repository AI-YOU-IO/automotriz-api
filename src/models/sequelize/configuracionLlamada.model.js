const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const ConfiguracionLlamada = sequelize.define('ConfiguracionLlamada', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_campania: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'campania',
        key: 'id'
      }
    },
    dia: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    activo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '09:00'
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '18:00'
    },
    max_intentos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3
    },
    ...commonFields
  }, {
    tableName: 'configuracion_llamada',
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

  ConfiguracionLlamada.associate = (models) => {
    ConfiguracionLlamada.belongsTo(models.Campania, { foreignKey: 'id_campania', as: 'campania' });
  };

  return ConfiguracionLlamada;
};
