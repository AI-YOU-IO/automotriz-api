const { Formato, FormatoCampo, sequelize } = require("../models/sequelize");
const { QueryTypes } = require("sequelize");

class FormatoRepository {
  async findAll(idEmpresa) {
    const whereClause = { estado_registro: 1 };
    if (idEmpresa) whereClause.id_empresa = idEmpresa;

    const formatos = await Formato.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    // Agregar total_campos a cada formato
    const result = [];
    for (const formato of formatos) {
      const plain = formato.toJSON();
      const [count] = await sequelize.query(
        'SELECT COUNT(*) as total FROM formato_campo WHERE id_formato = :id AND estado_registro = 1',
        { replacements: { id: plain.id }, type: QueryTypes.SELECT }
      );
      plain.total_campos = parseInt(count.total);
      result.push(plain);
    }
    return result;
  }

  async findById(id) {
    const formato = await Formato.findByPk(id);
    if (!formato) return null;

    const plain = formato.toJSON();
    const campos = await FormatoCampo.findAll({
      where: { id_formato: id, estado_registro: 1 },
      order: [['orden', 'ASC']]
    });
    plain.campos = campos;
    return plain;
  }

  async create(data) {
    return Formato.create(data);
  }

  async update(id, data) {
    return Formato.update(data, { where: { id } });
  }

  async delete(id) {
    return Formato.update({ estado_registro: 0 }, { where: { id } });
  }
}

module.exports = new FormatoRepository();
