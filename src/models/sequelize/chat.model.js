const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prospecto',
        key: 'id'
      }
    },
    bot_activo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    ...commonFields
  }, {
    tableName: 'chat',
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

  Chat.associate = (models) => {
    Chat.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
    Chat.hasMany(models.Mensaje, { foreignKey: 'id_chat', as: 'mensajes' });
  };

  return Chat;
};
