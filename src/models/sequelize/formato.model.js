const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Formato = sequelize.define('Formato', {
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
    tableName: 'formato',
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

  Formato.associate = (models) => {
    Formato.hasMany(models.FormatoCampo, { foreignKey: 'id_formato', as: 'campos' });
    Formato.hasMany(models.Plantilla, { foreignKey: 'id_formato', as: 'plantillas' });
  };

  return Formato;
};
