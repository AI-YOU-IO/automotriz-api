const { pool } = require("../../config/dbConnection.js");

/**
 * Obtener todos los recordatorios de contactos
 * @param {Object} filtros - Filtros opcionales
 * @returns {Promise<Object>}
 */
async function getContactoRecordatorios(filtros = {}) {
    try {
        const { id_contacto } = filtros;

        let query = `
            SELECT
                id,
                id_contacto,
                cantidad,
                limite,
                estado_registro,
                fecha_registro,
                fecha_actualizacion
            FROM contacto_recordatorios
            WHERE estado_registro = 1
        `;

        const params = [];

        if (id_contacto) {
            query += ` AND id_contacto = ?`;
            params.push(id_contacto);
        }

        const [rows] = await pool.execute(query, params);

        return {
            success: true,
            data: rows,
            total: rows.length
        };

    } catch (error) {
        console.error(`Error al obtener recordatorios de contacto: ${error.message}`);
        throw error;
    }
}

/**
 * Obtener un recordatorio por ID de contacto
 * @param {number} id_contacto - ID del contacto
 * @returns {Promise<Object>}
 */
async function getRecordatorioByContactoId(id_contacto) {
    try {
        const [rows] = await pool.execute(
            `SELECT id, id_contacto, cantidad, limite, estado_registro, fecha_registro, fecha_actualizacion
             FROM contacto_recordatorios WHERE id_contacto = ? AND estado_registro = 1`,
            [id_contacto]
        );

        if (rows.length === 0) {
            return { success: false, exists: false, error: 'Recordatorio no encontrado' };
        }

        return {
            success: true,
            exists: true,
            data: rows[0]
        };

    } catch (error) {
        console.error(`Error al obtener recordatorio de contacto: ${error.message}`);
        throw error;
    }
}

/**
 * Incrementar o crear recordatorio para un contacto
 * Si no existe el registro, crea uno nuevo con cantidad = 1
 * Si existe, incrementa cantidad en 1
 * Si la nueva cantidad supera el limite, retorna limite_alcanzado = true
 *
 * @param {number} id_contacto - ID del contacto
 * @param {number} limite_default - Limite por defecto si se crea nuevo registro (default 3)
 * @returns {Promise<Object>}
 */
async function incrementarRecordatorio(id_contacto, limite_default = 3) {
    try {
        if (!id_contacto) {
            return { success: false, error: 'id_contacto es requerido' };
        }

        // Verificar si existe el registro
        const [existing] = await pool.execute(
            `SELECT id, cantidad, limite FROM contacto_recordatorios
             WHERE id_contacto = ? AND estado_registro = 1`,
            [id_contacto]
        );

        if (existing.length === 0) {
            // No existe, crear nuevo registro con cantidad = 1
            const [result] = await pool.execute(
                `INSERT INTO contacto_recordatorios (id_contacto, cantidad, limite, estado_registro, fecha_registro)
                 VALUES (?, 1, ?, 1, NOW())`,
                [id_contacto, limite_default]
            );

            return {
                success: true,
                action: 'created',
                message: 'Recordatorio creado correctamente',
                id: result.insertId,
                id_contacto: id_contacto,
                cantidad: 1,
                limite: limite_default,
                limite_alcanzado: false
            };
        }

        // Existe, verificar si ya alcanzó el límite
        const record = existing[0];
        const nuevaCantidad = record.cantidad + 1;
        const limiteAlcanzado = nuevaCantidad > record.limite;

        if (limiteAlcanzado) {
            // Ya alcanzó el límite, no incrementar
            return {
                success: true,
                action: 'limit_reached',
                message: 'Se alcanzó el límite de recordatorios',
                id: record.id,
                id_contacto: id_contacto,
                cantidad: record.cantidad,
                limite: record.limite,
                limite_alcanzado: true
            };
        }

        // Incrementar cantidad
        await pool.execute(
            `UPDATE contacto_recordatorios
             SET cantidad = cantidad + 1, fecha_actualizacion = NOW()
             WHERE id = ?`,
            [record.id]
        );

        return {
            success: true,
            action: 'updated',
            message: 'Recordatorio incrementado correctamente',
            id: record.id,
            id_contacto: id_contacto,
            cantidad: nuevaCantidad,
            limite: record.limite,
            limite_alcanzado: nuevaCantidad >= record.limite
        };

    } catch (error) {
        console.error(`Error al incrementar recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Resetear cantidad de recordatorios de un contacto a 0
 * @param {number} id_contacto - ID del contacto
 * @returns {Promise<Object>}
 */
async function resetearRecordatorio(id_contacto) {
    try {
        if (!id_contacto) {
            return { success: false, error: 'id_contacto es requerido' };
        }

        const [result] = await pool.execute(
            `UPDATE contacto_recordatorios
             SET cantidad = 0, fecha_actualizacion = NOW()
             WHERE id_contacto = ? AND estado_registro = 1`,
            [id_contacto]
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Recordatorio no encontrado para este contacto' };
        }

        return {
            success: true,
            message: 'Recordatorio reseteado correctamente',
            id_contacto: id_contacto,
            cantidad: 0
        };

    } catch (error) {
        console.error(`Error al resetear recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Actualizar el límite de recordatorios de un contacto
 * @param {number} id_contacto - ID del contacto
 * @param {number} nuevo_limite - Nuevo límite
 * @returns {Promise<Object>}
 */
async function actualizarLimiteRecordatorio(id_contacto, nuevo_limite) {
    try {
        if (!id_contacto || nuevo_limite === undefined) {
            return { success: false, error: 'id_contacto y nuevo_limite son requeridos' };
        }

        const [result] = await pool.execute(
            `UPDATE contacto_recordatorios
             SET limite = ?, fecha_actualizacion = NOW()
             WHERE id_contacto = ? AND estado_registro = 1`,
            [nuevo_limite, id_contacto]
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Recordatorio no encontrado para este contacto' };
        }

        return {
            success: true,
            message: 'Límite actualizado correctamente',
            id_contacto: id_contacto,
            limite: nuevo_limite
        };

    } catch (error) {
        console.error(`Error al actualizar límite de recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Eliminar (soft delete) un recordatorio de contacto
 * @param {number} id_contacto - ID del contacto
 * @returns {Promise<Object>}
 */
async function deleteRecordatorio(id_contacto) {
    try {
        const [result] = await pool.execute(
            `UPDATE contacto_recordatorios
             SET estado_registro = 0, fecha_actualizacion = NOW()
             WHERE id_contacto = ? AND estado_registro = 1`,
            [id_contacto]
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Recordatorio no encontrado' };
        }

        return {
            success: true,
            message: 'Recordatorio eliminado correctamente'
        };

    } catch (error) {
        console.error(`Error al eliminar recordatorio: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getContactoRecordatorios,
    getRecordatorioByContactoId,
    incrementarRecordatorio,
    resetearRecordatorio,
    actualizarLimiteRecordatorio,
    deleteRecordatorio
};
