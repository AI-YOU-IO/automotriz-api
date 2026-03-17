const { pool } = require("../../config/dbConnection.js");

/**
 * Obtener todos los argumentos de venta activos
 * @param {Object} filtros - Filtros opcionales
 * @param {number} filtros.id - ID espec�fico del argumento (opcional)
 * @param {number} filtros.estado_registro - Estado del registro (opcional, default 1 = activo)
 * @param {number} filtros.limit - L�mite de resultados (opcional, default 100)
 * @returns {Promise<Object>}
 */
async function getArgumentosVenta(filtros = {}) {
    try {

        let query = `
            SELECT
                id,
                titulo,
                argumento,
                estado_registro,
                fecha_registro,
                fecha_actualizacion
            FROM argumento_venta
            WHERE estado_registro = 1
        `;

        const [rows] = await pool.execute(query);

        return {
            success: true,
            data: rows,
            total: rows.length
        };

    } catch (error) {
        console.error(`Error al obtener argumentos de venta: ${error.message}`);
        throw error;
    }
}

/**
 * Obtener un argumento de venta por ID
 * @param {number} id - ID del argumento
 * @returns {Promise<Object>}
 */
async function getArgumentoVentaById(id) {
    try {
        const [rows] = await pool.execute(
            `SELECT id, titulo, argumento, estado_registro, fecha_registro, fecha_actualizacion
             FROM argumento_venta WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return { success: false, error: 'Argumento no encontrado' };
        }

        return {
            success: true,
            data: rows[0]
        };

    } catch (error) {
        console.error(`Error al obtener argumento de venta: ${error.message}`);
        throw error;
    }
}

/**
 * Crear un nuevo argumento de venta
 * @param {string} titulo - T�tulo del argumento
 * @param {string} argumento - Contenido del argumento
 * @returns {Promise<Object>}
 */
async function createArgumentoVenta(titulo, argumento) {
    try {
        if (!titulo || !argumento) {
            return { success: false, error: 'T�tulo y argumento son requeridos' };
        }

        const [result] = await pool.execute(
            `INSERT INTO argumento_venta (titulo, argumento, estado_registro, fecha_registro)
             VALUES (?, ?, 1, NOW())`,
            [titulo, argumento]
        );

        return {
            success: true,
            message: 'Argumento creado correctamente',
            id: result.insertId
        };

    } catch (error) {
        console.error(`Error al crear argumento de venta: ${error.message}`);
        throw error;
    }
}

/**
 * Actualizar un argumento de venta
 * @param {number} id - ID del argumento
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>}
 */
async function updateArgumentoVenta(id, datos) {
    try {
        const { titulo, argumento, estado_registro } = datos;

        const updates = [];
        const params = [];

        if (titulo !== undefined) {
            updates.push('titulo = ?');
            params.push(titulo);
        }
        if (argumento !== undefined) {
            updates.push('argumento = ?');
            params.push(argumento);
        }
        if (estado_registro !== undefined) {
            updates.push('estado_registro = ?');
            params.push(estado_registro);
        }

        if (updates.length === 0) {
            return { success: false, error: 'No hay datos para actualizar' };
        }

        updates.push('fecha_actualizacion = NOW()');
        params.push(id);

        const [result] = await pool.execute(
            `UPDATE argumento_venta SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Argumento no encontrado' };
        }

        return {
            success: true,
            message: 'Argumento actualizado correctamente'
        };

    } catch (error) {
        console.error(`Error al actualizar argumento de venta: ${error.message}`);
        throw error;
    }
}

/**
 * Eliminar (soft delete) un argumento de venta
 * @param {number} id - ID del argumento
 * @returns {Promise<Object>}
 */
async function deleteArgumentoVenta(id) {
    try {
        const [result] = await pool.execute(
            `UPDATE argumento_venta SET estado_registro = 0, fecha_actualizacion = NOW() WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Argumento no encontrado' };
        }

        return {
            success: true,
            message: 'Argumento eliminado correctamente'
        };

    } catch (error) {
        console.error(`Error al eliminar argumento de venta: ${error.message}`);
        throw error;
    }
}

// ==================== PERIODICIDAD RECORDATORIO ====================

/**
 * Obtener todas las periodicidades de recordatorio activas
 * @param {Object} filtros - Filtros opcionales
 * @returns {Promise<Object>}
 */
async function getPeriodicidadRecordatorio(filtros = {}) {
    try {
        let query = `
            SELECT
                id,
                nombre,
                cada_horas,
                estado_registro,
                fecha_registro,
                fecha_actualizacion
            FROM periodicidad_recordatorio
            WHERE estado_registro = 1
        `;

        const [rows] = await pool.execute(query);

        return {
            success: true,
            data: rows,
            total: rows.length
        };

    } catch (error) {
        console.error(`Error al obtener periodicidad de recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Obtener una periodicidad de recordatorio por ID
 * @param {number} id - ID de la periodicidad
 * @returns {Promise<Object>}
 */
async function getPeriodicidadRecordatorioById(id) {
    try {
        const [rows] = await pool.execute(
            `SELECT id, nombre, cada_horas, estado_registro, fecha_registro, fecha_actualizacion
             FROM periodicidad_recordatorio WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return { success: false, error: 'Periodicidad no encontrada' };
        }

        return {
            success: true,
            data: rows[0]
        };

    } catch (error) {
        console.error(`Error al obtener periodicidad de recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Crear una nueva periodicidad de recordatorio
 * @param {string} nombre - Nombre de la periodicidad
 * @param {number} cada_horas - Cada cuántas horas
 * @returns {Promise<Object>}
 */
async function createPeriodicidadRecordatorio(nombre, cada_horas) {
    try {
        if (!nombre || cada_horas === undefined) {
            return { success: false, error: 'Nombre y cada_horas son requeridos' };
        }

        const [result] = await pool.execute(
            `INSERT INTO periodicidad_recordatorio (nombre, cada_horas, estado_registro, fecha_registro)
             VALUES (?, ?, 1, NOW())`,
            [nombre, cada_horas]
        );

        return {
            success: true,
            message: 'Periodicidad creada correctamente',
            id: result.insertId
        };

    } catch (error) {
        console.error(`Error al crear periodicidad de recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Actualizar una periodicidad de recordatorio
 * @param {number} id - ID de la periodicidad
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>}
 */
async function updatePeriodicidadRecordatorio(id, datos) {
    try {
        const { nombre, cada_horas, estado_registro } = datos;

        const updates = [];
        const params = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            params.push(nombre);
        }
        if (cada_horas !== undefined) {
            updates.push('cada_horas = ?');
            params.push(cada_horas);
        }
        if (estado_registro !== undefined) {
            updates.push('estado_registro = ?');
            params.push(estado_registro);
        }

        if (updates.length === 0) {
            return { success: false, error: 'No hay datos para actualizar' };
        }

        updates.push('fecha_actualizacion = NOW()');
        params.push(id);

        const [result] = await pool.execute(
            `UPDATE periodicidad_recordatorio SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Periodicidad no encontrada' };
        }

        return {
            success: true,
            message: 'Periodicidad actualizada correctamente'
        };

    } catch (error) {
        console.error(`Error al actualizar periodicidad de recordatorio: ${error.message}`);
        throw error;
    }
}

/**
 * Eliminar (soft delete) una periodicidad de recordatorio
 * @param {number} id - ID de la periodicidad
 * @returns {Promise<Object>}
 */
async function deletePeriodicidadRecordatorio(id) {
    try {
        const [result] = await pool.execute(
            `UPDATE periodicidad_recordatorio SET estado_registro = 0, fecha_actualizacion = NOW() WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return { success: false, error: 'Periodicidad no encontrada' };
        }

        return {
            success: true,
            message: 'Periodicidad eliminada correctamente'
        };

    } catch (error) {
        console.error(`Error al eliminar periodicidad de recordatorio: ${error.message}`);
        throw error;
    }
}

module.exports = {
    // Argumentos de venta
    getArgumentosVenta,
    getArgumentoVentaById,
    createArgumentoVenta,
    updateArgumentoVenta,
    deleteArgumentoVenta,
    // Periodicidad de recordatorio
    getPeriodicidadRecordatorio,
    getPeriodicidadRecordatorioById,
    createPeriodicidadRecordatorio,
    updatePeriodicidadRecordatorio,
    deletePeriodicidadRecordatorio
};
