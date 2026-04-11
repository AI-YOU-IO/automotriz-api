const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const FormatoCampoPlantilla = sequelize.define('FormatoCampoPlantilla', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_plantilla: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'plantilla_whatsapp', key: 'id' }
    },
    id_formato_campo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'formato_campo', key: 'id' }
    },
    id_campo_sistema: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    constante: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado_registro: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: true
    },
    usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    usuario_actualizacion: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'formato_campo_plantilla',
    ...commonOptions,
    defaultScope: {
      where: { estado_registro: 1 }
    }
  });

  FormatoCampoPlantilla.associate = (models) => {
    FormatoCampoPlantilla.belongsTo(models.PlantillaWhatsapp, { foreignKey: 'id_plantilla', as: 'plantilla' });
    FormatoCampoPlantilla.belongsTo(models.FormatoCampo, { foreignKey: 'id_formato_campo', as: 'formatoCampo' });
    FormatoCampoPlantilla.belongsTo(models.CampoSistema, { foreignKey: 'id_campo_sistema', as: 'campoSistema' });
  };

  return FormatoCampoPlantilla;
};
