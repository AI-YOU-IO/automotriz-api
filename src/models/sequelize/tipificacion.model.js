const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Tipificacion = sequelize.define('Tipificacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefono: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    duracion_cita: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha_hora_cita: {
      type: DataTypes.DATE,
      allowNull: true
    },
    id_marca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'marca',
        key: 'id'
      }
    },
    id_version: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'version',
        key: 'id'
      }
    },
    id_modelo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modelo',
        key: 'id'
      }
    },
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prospecto',
        key: 'id'
      }
    },
    resumen: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ...commonFields
  }, {
    tableName: 'tipificacion',
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

  Tipificacion.associate = (models) => {
    Tipificacion.belongsTo(models.Marca, { foreignKey: 'id_marca', as: 'marca' });
    Tipificacion.belongsTo(models.Version, { foreignKey: 'id_version', as: 'version' });
    Tipificacion.belongsTo(models.Modelo, { foreignKey: 'id_modelo', as: 'modelo' });
    Tipificacion.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
  };

  return Tipificacion;
};
