const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const EnvioMasivoWhatsapp = sequelize.define('EnvioMasivoWhatsapp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_plantilla: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cantidad_exitosos: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cantidad_fallidos: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha_envio: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    estado_envio: {
      type: DataTypes.ENUM('pendiente', 'enviado'),
      allowNull: true
    },
    ...commonFields
  }, {
    tableName: 'envio_masivo_whatsapp',
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

  EnvioMasivoWhatsapp.associate = (models) => {
    EnvioMasivoWhatsapp.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    EnvioMasivoWhatsapp.belongsTo(models.PlantillaWhatsapp, { foreignKey: 'id_plantilla', as: 'plantilla' });
    EnvioMasivoWhatsapp.hasMany(models.EnviosProspectos, { foreignKey: 'id_envio_masivo', as: 'enviosProspectos' });
  };

  return EnvioMasivoWhatsapp;
};
