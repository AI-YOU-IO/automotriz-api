const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const TipoRecurso = sequelize.define('TipoRecurso', {
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
    tableName: 'tipo_recurso',
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

  TipoRecurso.associate = (models) => {
    TipoRecurso.hasMany(models.Recurso, { foreignKey: 'tipo_recurso_id', as: 'recursos' });
  };

  return TipoRecurso;
};
