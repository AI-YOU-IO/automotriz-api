const { Marca } = require('../models/marca.model.js');
const { Op } = require('sequelize');
class MarcaRepository { 
    async findAll(idEmpresa){
        const whereClause = { estado_registro: 1 };
        if (idEmpresa) whereClause.id_empresa = idEmpresa;
        
        return Marca.findAll({
            where: whereClause,
            order: [['nombre', 'ASC']]
        });

    }
}