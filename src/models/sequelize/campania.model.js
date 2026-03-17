const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Campania = sequelize.define('Campania', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    id_plantilla: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'plantilla',
        key: 'id'
      }
    },
    id_plantilla_whatsapp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'plantilla_whatsapp',
        key: 'id'
      }
    },
    id_tipo_campania: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tipo_campania',
        key: 'id'
      }
    },
    id_estado_campania: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'estado_campania',
        key: 'id'
      }
    },
    id_estado_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'estado_prospecto',
        key: 'id'
      }
    },
    id_voz: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'voz',
        key: 'id'
      }
    },
    configuracion_llamada: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    ...commonFields
  }, {
    tableName: 'campania',
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

  Campania.associate = (models) => {
    Campania.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Campania.belongsTo(models.Plantilla, { foreignKey: 'id_plantilla', as: 'plantilla' });
    Campania.belongsTo(models.PlantillaWhatsapp, { foreignKey: 'id_plantilla_whatsapp', as: 'plantillaWhatsapp' });
    Campania.belongsTo(models.TipoCampania, { foreignKey: 'id_tipo_campania', as: 'tipoCampania' });
    Campania.belongsTo(models.EstadoCampania, { foreignKey: 'id_estado_campania', as: 'estadoCampania' });
    Campania.belongsTo(models.EstadoProspecto, { foreignKey: 'id_estado_prospecto', as: 'estadoProspecto' });
    Campania.belongsTo(models.Voz, { foreignKey: 'id_voz', as: 'voz' });
    Campania.hasMany(models.CampaniaEjecucion, { foreignKey: 'id_campania', as: 'campaniaEjecuciones' });
    Campania.hasMany(models.CampaniaProspectos, { foreignKey: 'id_campania', as: 'campaniaProspectos' });
    Campania.hasMany(models.ConfiguracionLlamada, { foreignKey: 'id_campania', as: 'configuracionesLlamada' });
  };

  return Campania;
};
