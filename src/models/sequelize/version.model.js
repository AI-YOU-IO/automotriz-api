const { DataTypes } = require('sequelize');
const { commonFields, commonOptions } = require('../base/baseModel');

module.exports = (sequelize) => {
    const Version = sequelize.define('Version', {
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
        id_modelo:{
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'modelo',
                key: 'id'
            }
        },
        anio: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        ...commonFields
    }, {
        tableName: 'version',
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

    Version.associate = (models) => {
        Version.belongsTo(models.Modelo, { foreignKey: 'id_modelo', as: 'modelo' });
    }
    return Version;
};