const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Transcripcion = sequelize.define('Transcripcion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    id_llamada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'llamada',
        key: 'id'
      }
    },
    id_speaker: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'speaker',
        key: 'id'
      }
    },
    inicio_seg: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    fin_seg: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    speaker_role: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ordinal: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estado_registro: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    usuario_actualizacion: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'transcripcion',
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

  Transcripcion.associate = (models) => {
    Transcripcion.belongsTo(models.Llamada, { foreignKey: 'id_llamada', as: 'llamada' });
    Transcripcion.belongsTo(models.Speaker, { foreignKey: 'id_speaker', as: 'speaker' });
  };

  return Transcripcion;
};
