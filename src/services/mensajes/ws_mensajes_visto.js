const { pool } = require("../../config/dbConnection.js");

/**
 * Obtener mensajes que han sido marcados como vistos
 * @param {Object} filtros - Filtros opcionales
 * @param {number} filtros.id_contacto - ID del contacto (opcional)
 * @param {number} filtros.limit - Límite de resultados (opcional, por defecto 100)
 * @returns {Promise<Object>} - Lista de mensajes vistos y cantidad
 */
async function getMensajesEnVisto(filtros = {}) {
    try {
        const { id_contacto, direccion = 'out', limit = 100 } = filtros;

        let query = `
            SELECT 
    ultimos_mensajes.id_contacto,
    ultimos_mensajes.respuesta_ia,
    ultimos_mensajes.fecha_ia,
    ultimos_mensajes.celular_contacto,
    p.id_estado,
    COUNT(*) as total_conversaciones_fallidas
FROM (
    SELECT 
        c.id as id_contacto,
        m2.contenido as respuesta_ia,
        m2.fecha_hora as fecha_ia,
        c.id_prospecto,  -- Asumo que el campo se llama id_prospecto
        c.celular as celular_contacto,
        ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY m2.fecha_hora DESC) as row_num
    FROM mensaje m1
    INNER JOIN mensaje m2 ON m1.wid_mensaje = m2.wid_mensaje
                     AND m1.direccion = 'in'
                     AND m2.direccion = 'out'
    INNER JOIN contacto c ON m1.id_contacto = c.id
                     AND m2.id_contacto = c.id
    WHERE m1.wid_mensaje IS NOT NULL
        AND m2.fecha_hora >= DATE_SUB(NOW(), INTERVAL 2 DAY)
) AS ultimos_mensajes
INNER JOIN prospecto p ON ultimos_mensajes.id_prospecto = p.id
WHERE ultimos_mensajes.row_num = 1
  AND p.id_estado IN (1, 5)  -- Solo estados 1 y 5
GROUP BY ultimos_mensajes.id_contacto, ultimos_mensajes.respuesta_ia, p.id_estado, ultimos_mensajes.fecha_ia 
ORDER BY total_conversaciones_fallidas DESC;
        `;

        if (id_contacto) {
            query += ` AND m.id_contacto = ?`;
            params.push(id_contacto);
        }

        // query += ` ORDER BY m.fecha_registro DESC LIMIT ?`;
        // params.push(limit);

        const [rows] = await pool.execute(query);

        return {
            success: true,
            mensajes_en_visto: rows,
            cantidad_mensajes: rows.length
        };

    } catch (error) {
        console.error(`Error al obtener los mensajes en visto: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getMensajesEnVisto
};
