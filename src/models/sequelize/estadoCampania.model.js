const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const EstadoCampania = sequelize.define('EstadoCampania', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true
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
    tableName: 'estado_campania',
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

  EstadoCampania.associate = (models) => {
    EstadoCampania.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    EstadoCampania.hasMany(models.Campania, { foreignKey: 'id_estado_campania', as: 'campanias' });
  };

  return EstadoCampania;
};
