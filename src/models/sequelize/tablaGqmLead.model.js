const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TablaGqmLead = sequelize.define('TablaGqmLead', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    n_lead: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    source_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    nombre: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    marca: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    modelo: {
      type: DataTypes.STRING(250),
      allowNull: true
    }
  }, {
    tableName: 'tabla_gqm_lead',
    timestamps: false,
    underscored: true,
    freezeTableName: true
  });

  return TablaGqmLead;
};
