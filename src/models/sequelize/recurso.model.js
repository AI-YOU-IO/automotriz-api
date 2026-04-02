const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Recurso = sequelize.define('Recurso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    id_modelo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'modelo',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    id_tipo_recurso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tipo_recurso',
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
    tableName: 'recurso',
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

  Recurso.associate = (models) => {
    Recurso.belongsTo(models.Modelo, { foreignKey: 'id_modelo', as: 'modelo' });
    Recurso.belongsTo(models.TipoRecurso, { foreignKey: 'id_tipo_recurso', as: 'tipoRecurso' });
    Recurso.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
  };

  return Recurso;
};
