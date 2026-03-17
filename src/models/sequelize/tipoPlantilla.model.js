const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const TipoPlantilla = sequelize.define('TipoPlantilla', {
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
    tableName: 'tipo_plantilla',
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

  TipoPlantilla.associate = (models) => {
    TipoPlantilla.hasMany(models.Plantilla, { foreignKey: 'id_tipo_plantilla', as: 'plantillas' });
  };

  return TipoPlantilla;
};
