const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Prospecto = sequelize.define('Prospecto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_completo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    dni: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    celular: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    perfilamiento: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    puntaje: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'id'
      }
    },
    id_estado_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estado_prospecto',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sperant_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    fue_contactado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    calificacion_lead: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'frio'
    },
    ...commonFields
  }, {
    tableName: 'prospecto',
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

  Prospecto.associate = (models) => {
    Prospecto.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Prospecto.belongsTo(models.EstadoProspecto, { foreignKey: 'id_estado_prospecto', as: 'estadoProspecto' });
    Prospecto.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
    Prospecto.hasMany(models.Chat, { foreignKey: 'id_prospecto', as: 'chats' });
    Prospecto.hasMany(models.Cita, { foreignKey: 'id_prospecto', as: 'citas' });
    Prospecto.hasMany(models.Interaccion, { foreignKey: 'id_prospecto', as: 'interacciones' });
    Prospecto.hasMany(models.CampaniaProspectos, { foreignKey: 'id_prospecto', as: 'campaniaProspectos' });
    Prospecto.hasMany(models.ProspectoRecordatorio, { foreignKey: 'id_prospecto', as: 'recordatorios' });
    Prospecto.hasMany(models.Llamada, { foreignKey: 'id_prospecto', as: 'llamadas' });
    Prospecto.hasMany(models.Tipificacion, { foreignKey: 'id_prospecto', as: 'tipificaciones' });
  };

  return Prospecto;
};
