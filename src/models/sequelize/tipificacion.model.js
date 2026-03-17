const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Tipificacion = sequelize.define('Tipificacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefono: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_hora_cita: {
      type: DataTypes.DATE,
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
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prospecto',
        key: 'id'
      }
    },
    num_habitaciones: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    piso_referidos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    precio_indicado: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    descuento: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    cuota_crediticia: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    score_crediticio: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    resumen: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ...commonFields
  }, {
    tableName: 'tipificacion',
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

  Tipificacion.associate = (models) => {
    Tipificacion.belongsTo(models.Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' });
    Tipificacion.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
  };

  return Tipificacion;
};
