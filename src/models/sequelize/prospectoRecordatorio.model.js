const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const ProspectoRecordatorio = sequelize.define('ProspectoRecordatorio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    limite: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prospecto',
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
      allowNull: false
    }
  }, {
    tableName: 'prospecto_recordatorio',
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

  ProspectoRecordatorio.associate = (models) => {
    ProspectoRecordatorio.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
  };

  return ProspectoRecordatorio;
};
