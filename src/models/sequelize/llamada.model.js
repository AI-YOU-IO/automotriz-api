const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Llamada = sequelize.define('Llamada', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    provider_call_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    id_ultravox_call: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata_ultravox_call: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duracion_seg: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    metadata_json: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    url_audio: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    archivo_llamada: {
      type: DataTypes.STRING(500),
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
    id_estado_llamada: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'estado_llamada',
        key: 'id'
      }
    },
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'prospecto',
        key: 'id'
      }
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
    tableName: 'llamada',
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

  Llamada.associate = (models) => {
    Llamada.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Llamada.belongsTo(models.EstadoLlamada, { foreignKey: 'id_estado_llamada', as: 'estadoLlamada' });
    Llamada.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
    Llamada.belongsTo(models.CampaniaEjecucion, { foreignKey: 'id_campania_ejecucion', as: 'campaniaEjecucion' });
    Llamada.hasMany(models.Transcripcion, { foreignKey: 'id_llamada', as: 'transcripciones' });
  };

  return Llamada;
};
