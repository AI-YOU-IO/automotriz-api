const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const EnviosProspectos = sequelize.define('EnviosProspectos', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_envio_masivo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'completado', 'fallido', 'cancelado'),
      allowNull: true
    },
    fecha_envio: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    error_mensaje: {
      type: DataTypes.STRING,
      allowNull: true
    },
    id_campania_ejecucion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'campania_ejecucion',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'envios_prospectos',
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

  EnviosProspectos.associate = (models) => {
    EnviosProspectos.belongsTo(models.EnvioMasivoWhatsapp, { foreignKey: 'id_envio_masivo', as: 'envioMasivo' });
    EnviosProspectos.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
    EnviosProspectos.belongsTo(models.CampaniaEjecucion, { foreignKey: 'id_campania_ejecucion', as: 'campaniaEjecucion' });
  };

  return EnviosProspectos;
};
