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
    lugar: {
      type: DataTypes.STRING(60),
      allowNull: true
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
    id_proyecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'proyecto',
        key: 'id'
      }
    },
    id_unidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'unidad',
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
    Cita.belongsTo(models.Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' });
    Cita.belongsTo(models.Unidad, { foreignKey: 'id_unidad', as: 'unidad' });
    Cita.belongsTo(models.EstadoCita, { foreignKey: 'id_estado_cita', as: 'estadoCita' });
    Cita.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
  };

  return Cita;
};
