const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const CampaniaEjecucion = sequelize.define('CampaniaEjecucion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fecha_programada: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resultado: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    mensaje_error: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    id_campania: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'campania',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'campania_ejecucion',
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

  CampaniaEjecucion.associate = (models) => {
    CampaniaEjecucion.belongsTo(models.Campania, { foreignKey: 'id_campania', as: 'campania' });
    CampaniaEjecucion.hasMany(models.CampaniaProspectos, { foreignKey: 'id_campania', sourceKey: 'id_campania', as: 'campaniaProspectos' });
    CampaniaEjecucion.hasMany(models.Llamada, { foreignKey: 'id_campania_ejecucion', as: 'llamadas' });
    CampaniaEjecucion.hasMany(models.EnviosProspectos, { foreignKey: 'id_campania_ejecucion', as: 'enviosProspectos' });
  };

  return CampaniaEjecucion;
};
