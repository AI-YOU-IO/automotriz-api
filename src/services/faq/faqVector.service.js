const { OpenAI } = require('openai');
const { vectorPool } = require('../../config/vectorDatabase');
const logger = require('../../config/logger/loggerClient');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

class FaqVectorService {
  async getAll(idEmpresa) {
    const { rows } = await vectorPool.query(
      `SELECT id, pregunta, respuesta
       FROM faq_chunks
       WHERE id_empresa = $1
       ORDER BY id ASC`,
      [idEmpresa]
    );
    return rows;
  }

  async create({ id_empresa, pregunta, respuesta }) {
    try {
      const embedding = await generateEmbedding(`${pregunta}\n${respuesta}`);
      const embeddingStr = `[${embedding.join(',')}]`;

      const { rows } = await vectorPool.query(
        `INSERT INTO faq_chunks (id_empresa, pregunta, respuesta, embedding)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [id_empresa, pregunta, respuesta, embeddingStr]
      );

      logger.info(`[FaqVectorService] create ok id=${rows[0].id}`);
      return rows[0];
    } catch (error) {
      logger.error(`[FaqVectorService.create] ${error.message}`);
      throw error;
    }
  }

  async update(id, { pregunta, respuesta }) {
    try {
      const embedding = await generateEmbedding(`${pregunta}\n${respuesta}`);
      const embeddingStr = `[${embedding.join(',')}]`;

      await vectorPool.query(
        `UPDATE faq_chunks
         SET pregunta = $1, respuesta = $2, embedding = $3
         WHERE id = $4`,
        [pregunta, respuesta, embeddingStr, id]
      );

      logger.info(`[FaqVectorService] update ok id=${id}`);
    } catch (error) {
      logger.error(`[FaqVectorService.update] id=${id}: ${error.message}`);
      throw error;
    }
  }

  async delete(id) {
    try {
      await vectorPool.query('DELETE FROM faq_chunks WHERE id = $1', [id]);
      logger.info(`[FaqVectorService] delete ok id=${id}`);
    } catch (error) {
      logger.error(`[FaqVectorService.delete] id=${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca FAQs similares a una consulta usando similitud coseno.
   * @param {string} query
   * @param {number} idEmpresa
   * @param {number} limit
   * @returns {Array<{ pregunta, respuesta, similarity }>}
   */
  async search(query, idEmpresa, limit = 5) {
    try {
      const embedding = await generateEmbedding(query);
      const embeddingStr = `[${embedding.join(',')}]`;

      const { rows } = await vectorPool.query(
        `SELECT pregunta, respuesta,
                1 - (embedding <=> $1::vector) AS similarity
         FROM faq_chunks
         WHERE id_empresa = $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [embeddingStr, idEmpresa, limit]
      );

      return rows;
    } catch (error) {
      logger.error(`[FaqVectorService.search] ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FaqVectorService();
