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
    id_proyecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'proyecto',
        key: 'id'
      }
    },
    id_tipologia: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tipologia',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    tipo_recurso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tipo_recurso',
        key: 'id'
      }
    },
    empresa_id: {
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
    Recurso.belongsTo(models.Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' });
    Recurso.belongsTo(models.Tipologia, { foreignKey: 'id_tipologia', as: 'tipologia' });
    Recurso.belongsTo(models.TipoRecurso, { foreignKey: 'tipo_recurso_id', as: 'tipoRecurso' });
    Recurso.belongsTo(models.Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
  };

  return Recurso;
};
