const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Unidad = sequelize.define('Unidad', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sperant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    estado_comercial: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    precio_venta: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    estado_unidad: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'disponible'
    },
    area_total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    moneda: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PEN'
    },
    area_construida: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    precio_comercial: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    area_lote: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    tipo_unidad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipologia_nombre: {
      type: DataTypes.STRING(100),
      field: 'tipologia',
      allowNull: true
    },
    piso: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    edificio: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_proyecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'proyecto',
        key: 'id'
      }
    },
    id_tipologia: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tipologia',
        key: 'id'
      }
    },
    sperant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ...commonFields
  }, {
    tableName: 'unidad',
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

  Unidad.associate = (models) => {
    Unidad.belongsTo(models.Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' });
    Unidad.belongsTo(models.Tipologia, { foreignKey: 'id_tipologia', as: 'tipologia' });
    Unidad.hasMany(models.Cita, { foreignKey: 'id_unidad', as: 'citas' });
    Unidad.hasMany(models.Interaccion, { foreignKey: 'id_unidad', as: 'interacciones' });
  };

  return Unidad;
};
