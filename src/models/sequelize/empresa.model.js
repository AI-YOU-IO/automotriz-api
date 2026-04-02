const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
  const Empresa = sequelize.define('Empresa', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    razon_social: {
      type: DataTypes.STRING(70),
      allowNull: false
    },
    nombre_comercial: {
      type: DataTypes.STRING(70),
      allowNull: false
    },
    ruc: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    telefono: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ...commonFields
  }, {
    tableName: 'empresa',
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

  Empresa.associate = (models) => {
    Empresa.hasMany(models.Usuario, { foreignKey: 'id_empresa', as: 'usuarios' });
    Empresa.hasMany(models.Sucursal, { foreignKey: 'id_empresa', as: 'sucursales' });
    Empresa.hasMany(models.Rol, { foreignKey: 'id_empresa', as: 'roles' });
    Empresa.hasMany(models.Campania, { foreignKey: 'id_empresa', as: 'campanias' });
    Empresa.hasMany(models.Faq, { foreignKey: 'id_empresa', as: 'faqs' });
    Empresa.hasMany(models.PeriodicidadRecordatorio, { foreignKey: 'id_empresa', as: 'periodicidades' });
    Empresa.hasMany(models.Plantilla, { foreignKey: 'id_empresa', as: 'plantillas' });
    Empresa.hasMany(models.Marca, {foreignKey: 'id_empresa', as: 'marcas'});
    Empresa.hasMany(models.EstadoCita, { foreignKey: 'id_empresa', as: 'estadosCita' });
    Empresa.hasMany(models.EstadoProspecto, { foreignKey: 'id_empresa', as: 'estadosProspecto' });
    Empresa.hasMany(models.EstadoLlamada, { foreignKey: 'id_empresa', as: 'estadosLlamada' });
    Empresa.hasMany(models.Llamada, { foreignKey: 'id_empresa', as: 'llamadas' });
    Empresa.hasMany(models.Recurso, { foreignKey: 'id_empresa', as: 'recursos' });
    Empresa.hasMany(models.Prospecto, { foreignKey: 'id_empresa', as: 'prospectos' });
  };

  return Empresa;
};
