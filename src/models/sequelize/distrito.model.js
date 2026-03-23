const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Distrito = sequelize.define('Distrito', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'distrito',
    timestamps: false
  });

  return Distrito;
};
