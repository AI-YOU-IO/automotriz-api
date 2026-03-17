const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const TipoCampania = sequelize.define('TipoCampania', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ...commonFields
  }, {
    tableName: 'tipo_campania',
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

  TipoCampania.associate = (models) => {
    TipoCampania.hasMany(models.Campania, { foreignKey: 'id_tipo_campania', as: 'campanias' });
  };

  return TipoCampania;
};
