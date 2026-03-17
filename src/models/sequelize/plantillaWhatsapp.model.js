const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const PlantillaWhatsapp = sequelize.define('PlantillaWhatsapp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    category: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'MARKETING'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'es'
    },
    header_type: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    header_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    footer: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    buttons: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('buttons');
        return raw ? JSON.parse(raw) : [];
      },
      set(value) {
        this.setDataValue('buttons', value ? JSON.stringify(value) : null);
      }
    },
    stats_enviados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    stats_entregados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    stats_leidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
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
    },
    url_imagen: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    meta_template_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'plantilla_whatsapp',
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

  PlantillaWhatsapp.associate = (models) => {
    PlantillaWhatsapp.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    PlantillaWhatsapp.hasMany(models.Mensaje, { foreignKey: 'id_plantilla_whatsapp', as: 'mensajes' });
  };

  return PlantillaWhatsapp;
};
