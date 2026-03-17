const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DistritoAdyacente = sequelize.define('DistritoAdyacente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_adyacente: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_distrito: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'distrito',
        key: 'id'
      }
    },
    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'distrito_adyacente',
    timestamps: false
  });

  DistritoAdyacente.associate = (models) => {
    DistritoAdyacente.belongsTo(models.Distrito, { foreignKey: 'id_distrito', as: 'distrito' });
    DistritoAdyacente.belongsTo(models.Distrito, { foreignKey: 'id_adyacente', as: 'distritoAdyacente' });
  };

  return DistritoAdyacente;
};
