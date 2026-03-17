const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const RolModulo = sequelize.define('RolModulo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_modulo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modulo',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'rol_modulo',
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

  RolModulo.associate = (models) => {
    RolModulo.belongsTo(models.Modulo, { foreignKey: 'id_modulo', as: 'modulo' });
  };

  return RolModulo;
};
