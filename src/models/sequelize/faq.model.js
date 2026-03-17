const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Faq = sequelize.define('Faq', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pregunta: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    proceso: {
      type: DataTypes.STRING(70),
      allowNull: true
    },
    respuesta: {
      type: DataTypes.STRING(80),
      allowNull: false
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
    tableName: 'preguntas_frecuentes',
    ...commonOptions,
    defaultScope: {
      where: { estado_registro: 1 },
      order: [['numero', 'ASC']]
    },
    scopes: {
      withDeleted: {},
      onlyDeleted: {
        where: { estado_registro: 0 }
      }
    }
  });

  Faq.associate = (models) => {
    Faq.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return Faq;
};
