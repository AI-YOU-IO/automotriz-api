const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Modulo = sequelize.define('Modulo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ruta: {
      type: DataTypes.STRING(70),
      allowNull: false
    },
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rol',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'modulo',
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

  Modulo.associate = (models) => {
    Modulo.belongsTo(models.Rol, { foreignKey: 'id_rol', as: 'rol' });
    Modulo.hasMany(models.RolModulo, { foreignKey: 'id_modulo', as: 'rolModulos' });
  };

  return Modulo;
};
