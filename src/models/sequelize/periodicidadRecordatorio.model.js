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
    id_marca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'marca',
        key: 'id'
      }
    },
    id_plantilla: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'plantilla_whatsapp',
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
    PeriodicidadRecordatorio.belongsTo(models.Marca, { foreignKey: 'id_marca', as: 'marca' });
    PeriodicidadRecordatorio.belongsTo(models.PlantillaWhatsapp, { foreignKey: 'id_plantilla', as: 'plantilla' });
  };

  return PeriodicidadRecordatorio;
};
