const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const CampoSistema = sequelize.define('CampoSistema', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: true
    },
    etiqueta: {
      type: DataTypes.STRING,
      allowNull: true
    },
    requerido: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    tipo_dato: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado_registro: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: true
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
    tableName: 'campo_sistema',
    ...commonOptions,
    defaultScope: {
      where: { estado_registro: 1 }
    }
  });

  return CampoSistema;
};
