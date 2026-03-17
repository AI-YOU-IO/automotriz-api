const { DataTypes } = require('sequelize');

const commonFields = {
  estado_registro: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  usuario_registro: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  usuario_actualizacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
};

const commonOptions = {
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  createdAt: 'fecha_registro',
  updatedAt: 'fecha_actualizacion'
};

const createDefaultScopes = (estadoField = 'estado_registro', activeValue = 1) => ({
  defaultScope: {
    where: {
      [estadoField]: activeValue
    }
  },
  scopes: {
    withDeleted: {
      where: {}
    },
    onlyDeleted: {
      where: {
        [estadoField]: 0
      }
    }
  }
});

module.exports = {
  commonFields,
  commonOptions,
  createDefaultScopes
};
