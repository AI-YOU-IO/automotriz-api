const {DataTypes, where} = require('sequelize');
const {commonFields, commonOptions} = require('../base/baseModel');
const { all } = require('axios');

module.exports = (sequelize) =>{
    const Marca = sequelize.define('Marca', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        id_empresa:{
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'empresa',
                key: 'id'
            }

        },
        ...commonFields
    }, {
        tableName: 'marca',
        ...commonOptions,
        defaultScope:{
            where: { estado_registro: 1 },
            order: [['nombre', 'ASC']]
        },
        scopes: {
            withDeleted: {},
            onlyDeleted: {
                where: { estado_registro: 0 }
            }
        }
    });
    Marca.associate = (models) => {
        Marca.belongsTo(models.Empresa, { foreignKey: 'id_empresa', as: 'empresa' });
    };

    return Marca;
};