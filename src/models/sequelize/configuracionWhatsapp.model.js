const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const ConfiguracionWhatsapp = sequelize.define('ConfiguracionWhatsapp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    app_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numero_telefono_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    clave_secreta: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    token_whatsapp: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    waba_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    token_expiration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado_registro: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
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
    tableName: 'configuracion_whatsapp',
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

  ConfiguracionWhatsapp.associate = (models) => {
    ConfiguracionWhatsapp.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return ConfiguracionWhatsapp;
};
