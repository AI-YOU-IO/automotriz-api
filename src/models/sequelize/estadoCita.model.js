const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const EstadoCita = sequelize.define('EstadoCita', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'estado_cita',
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

  EstadoCita.associate = (models) => {
    EstadoCita.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    EstadoCita.hasMany(models.Cita, { foreignKey: 'id_estado_cita', as: 'citas' });
  };

  return EstadoCita;
};
