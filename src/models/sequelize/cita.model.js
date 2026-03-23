const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Cita = sequelize.define('Cita', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    hora_fin: {
      type: DataTypes.DATE,
      allowNull: false
    },
    id_sucursal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sucursal',
        key: 'id'
      }
    },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'prospecto',
        key: 'id'
      }
    },
    id_marca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'marca',
        key: 'id'
      }
    },
    id_modelo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'modelo',
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
    id_estado_cita: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estado_cita',
        key: 'id'
      }
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'id'
      }
    },
    ...commonFields
  }, {
    tableName: 'cita',
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

  Cita.associate = (models) => {
    Cita.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
    Cita.belongsTo(models.Version, { foreignKey: 'id_version', as: 'version' });
    Cita.belongsTo(models.Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
    Cita.belongsTo(models.Marca, { foreignKey: 'id_marca', as: 'marca' });
    Cita.belongsTo(models.Modelo, { foreignKey: 'id_modelo', as: 'modelo' });
    Cita.belongsTo(models.EstadoCita, { foreignKey: 'id_estado_cita', as: 'estadoCita' });
    Cita.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
  };

  return Cita;
};
