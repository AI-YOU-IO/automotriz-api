const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const DiaDescanso = sequelize.define('DiaDescanso', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id'
      }
    },
    fecha_descanso: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ...commonFields
  }, {
    tableName: 'dia_descanso',
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

  DiaDescanso.associate = (models) => {
    DiaDescanso.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
  };

  return DiaDescanso;
};
