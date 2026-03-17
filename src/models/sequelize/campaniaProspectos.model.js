const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const CampaniaProspectos = sequelize.define('CampaniaProspectos', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_campania: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'campania',
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
    ...commonFields
  }, {
    tableName: 'campania_prospectos',
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

  CampaniaProspectos.associate = (models) => {
    CampaniaProspectos.belongsTo(models.Campania, { foreignKey: 'id_campania', as: 'campania' });
    CampaniaProspectos.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
  };

  return CampaniaProspectos;
};
