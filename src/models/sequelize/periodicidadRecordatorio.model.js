const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const PeriodicidadRecordatorio = sequelize.define('PeriodicidadRecordatorio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(70),
      allowNull: false
    },
    cada_horas: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'periodicidad_recordatorio',
    ...commonOptions,
    defaultScope: {
      where: { estado_registro: 1 },
      order: [['cada_horas', 'ASC']]
    },
    scopes: {
      withDeleted: {},
      onlyDeleted: {
        where: { estado_registro: 0 }
      }
    }
  });

  PeriodicidadRecordatorio.associate = (models) => {
    PeriodicidadRecordatorio.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return PeriodicidadRecordatorio;
};
