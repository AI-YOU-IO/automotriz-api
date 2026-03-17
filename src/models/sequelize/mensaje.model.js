const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Mensaje = sequelize.define('Mensaje', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    direccion: {
      type: DataTypes.STRING(70),
      allowNull: false
    },
    tipo_mensaje: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    wid_mensaje: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contenido_archivo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'id'
      }
    },
    id_chat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat',
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
    ...commonFields
  }, {
    tableName: 'mensaje',
    ...commonOptions,
    defaultScope: {
      where: { estado_registro: 1 },
      order: [['fecha_hora', 'ASC']]
    },
    scopes: {
      withDeleted: {},
      onlyDeleted: {
        where: { estado_registro: 0 }
      }
    }
  });

  Mensaje.associate = (models) => {
    Mensaje.belongsTo(models.Chat, { foreignKey: 'id_chat', as: 'chat' });
    Mensaje.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
    Mensaje.belongsTo(models.PlantillaWhatsapp, { foreignKey: 'id_plantilla_whatsapp', as: 'plantillaWhatsapp' });
    Mensaje.hasMany(models.MensajeVisto, { foreignKey: 'id_mensaje', as: 'vistos' });
  };

  return Mensaje;
};
