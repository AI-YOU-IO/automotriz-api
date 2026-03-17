const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const MensajeVisto = sequelize.define('MensajeVisto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fecha_visto: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    id_mensaje: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'mensaje',
        key: 'id'
      }
    },
    tipo_recuperacion: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Tipo de recuperación: 1h, 8h, 24h, 48h, 72h (null si es visto normal)'
    },
    mensaje_enviado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si ya se envió la plantilla de recuperación para este tipo'
    },
    ...commonFields
  }, {
    tableName: 'mensaje_visto',
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

  MensajeVisto.associate = (models) => {
    MensajeVisto.belongsTo(models.Mensaje, { foreignKey: 'id_mensaje', as: 'mensaje' });
  };

  return MensajeVisto;
};
