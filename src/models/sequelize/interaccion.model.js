const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Interaccion = sequelize.define('Interaccion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    satisfactorio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    id_tipo_interaccion: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_proyecto: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'proyecto',
        key: 'id'
      }
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'id'
      }
    },
    id_nivel_interes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_unidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'unidad',
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
    utm_content: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    utm_term: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    utm_campaign: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    utm_medium: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    utm_source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    observaciones: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    id_motivo_desistimiento: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_canal_entrada: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    id_medio_captacion: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estado_registro: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    usuario_actualizacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    }
  }, {
    tableName: 'interaccion',
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

  Interaccion.associate = (models) => {
    Interaccion.belongsTo(models.Prospecto, { foreignKey: 'id_prospecto', as: 'prospecto' });
    Interaccion.belongsTo(models.Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' });
    Interaccion.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
    Interaccion.belongsTo(models.Unidad, { foreignKey: 'id_unidad', as: 'unidad' });
  };

  return Interaccion;
};
