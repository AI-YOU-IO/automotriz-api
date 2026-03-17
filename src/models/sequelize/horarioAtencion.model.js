const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const HorarioAtencion = sequelize.define('HorarioAtencion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    dia_semana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 }
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
    activo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    ...commonFields
  }, {
    tableName: 'horario_atencion',
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

  HorarioAtencion.associate = (models) => {
    HorarioAtencion.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return HorarioAtencion;
};
