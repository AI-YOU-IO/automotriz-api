const { DataTypes } = require('sequelize');
const { commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Proyecto = sequelize.define('Proyecto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    estado_proyecto: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'activo'
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    pais: {
      type: DataTypes.STRING(70),
      allowNull: true,
      defaultValue: 'Perú'
    },
    ciudad: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    id_distrito: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'distrito',
        key: 'id'
      }
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresa',
        key: 'id'
      }
    },
    estado_registro: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    usuario_registro: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sperant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true
    },
    url_google_maps: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    precio_desde: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    descuento_hasta: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }
  }, {
    tableName: 'proyecto',
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

  Proyecto.associate = (models) => {
    Proyecto.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    Proyecto.belongsTo(models.Distrito, { foreignKey: 'id_distrito', as: 'distrito' });
    Proyecto.hasMany(models.Unidad, { foreignKey: 'id_proyecto', as: 'unidades' });
    Proyecto.hasMany(models.Cita, { foreignKey: 'id_proyecto', as: 'citas' });
    Proyecto.hasMany(models.Interaccion, { foreignKey: 'id_proyecto', as: 'interacciones' });
    Proyecto.hasMany(models.Tipificacion, { foreignKey: 'id_proyecto', as: 'tipificaciones' });
    Proyecto.hasMany(models.Recurso, { foreignKey: 'id_proyecto', as: 'recursos' });
    Proyecto.hasMany(models.Tipologia, { foreignKey: 'id_proyecto', as: 'tipologias' });
  };

  return Proyecto;
};
