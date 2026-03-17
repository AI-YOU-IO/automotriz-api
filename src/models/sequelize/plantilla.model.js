const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Plantilla = sequelize.define('Plantilla', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    prompt_sistema: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prompt_inicio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prompt_flujo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prompt_cierre: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prompt_resultado: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    id_formato: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'formato',
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
    tableName: 'plantilla',
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

  Plantilla.associate = (models) => {
    Plantilla.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Plantilla.belongsTo(models.Formato, { foreignKey: 'id_formato', as: 'formato' });
  };

  return Plantilla;
};
