const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const PromptAsistente = sequelize.define('PromptAsistente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    prompt_sistema: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    estado_registro: {
      type: DataTypes.SMALLINT,
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
    tableName: 'prompt_asistente',
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

  PromptAsistente.associate = (models) => {
    PromptAsistente.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return PromptAsistente;
};
