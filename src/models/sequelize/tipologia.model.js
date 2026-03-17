const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Tipologia = sequelize.define('Tipologia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    area: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    unidades_disponibles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    numero_banios: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    numero_dormitorios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_unidades: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    precio_minimo: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    sperant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    id_proyecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'proyecto',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'tipologia',
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

  Tipologia.associate = (models) => {
    Tipologia.belongsTo(models.Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' });
    Tipologia.hasMany(models.Unidad, { foreignKey: 'id_tipologia', as: 'unidades' });
    Tipologia.hasMany(models.Recurso, { foreignKey: 'id_tipologia', as: 'recursos' });
  };

  return Tipologia;
};
