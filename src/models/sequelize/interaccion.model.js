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
    id_marca: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'marca',
        key: 'id'
      }
    },
    modelo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'modelo',
        key: 'id'
      } 
    },

    version:{
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'version',
        key: 'id'
      }
    },

    preguntas_resumen: {
      type: DataTypes.TEXT,
      allowNull: true
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
    id_prospecto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prospecto',
        key: 'id'
      }
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    motivo_desistimiento: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
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
    Interaccion.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
    Interaccion.belongsTo(models.Marca, { foreignKey: 'id_marca', as: 'marca' });
  };

  return Interaccion;
};
