const {DataTypes} = require('sequelize');
const {commonFields, commonOptions} = require('../base/baseModel');

module.exports = (sequelize) => {
    const Modelo = sequelize.define('Modelo', {
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
            type: DataTypes.TEXT,
            allowNull: true
        },
        id_marca:{
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'marca',
                key: 'id'
            }
        },
        ...commonFields
    }, {
        tableName: 'modelo',
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

    Modelo.associate = (models) => {
        Modelo.belongsTo(models.Marca, { foreignKey: 'id_marca', as: 'marca' });
    }
    return Modelo;
}