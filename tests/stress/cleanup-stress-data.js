/**
 * Limpia todos los datos generados por las pruebas de estrés de la BD.
 *
 * Elimina (soft delete con estado_registro = 0):
 *   - Mensajes con wid_mensaje que empiece con 'wamid.mock_', 'wamid.stress_' o 'wamid.chaos_'
 *   - Chats asociados a prospectos de stress test
 *   - Prospectos con nombre_completo = 'Stress Test'
 *   - Prospectos con celular de más de 20 caracteres (datos de chaos test)
 *
 * Uso:
 *   node tests/stress/cleanup-stress-data.js
 *   node tests/stress/cleanup-stress-data.js --hard    (DELETE real, no soft delete)
 *   node tests/stress/cleanup-stress-data.js --dry-run (solo muestra lo que borraría)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize } = require('../../src/config/database');

const args = process.argv.slice(2);
const HARD_DELETE = args.includes('--hard');
const DRY_RUN = args.includes('--dry-run');

async function limpiar() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   LIMPIEZA DE DATOS DE STRESS TEST              ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Modo: ${DRY_RUN ? 'DRY RUN (solo consulta)' : HARD_DELETE ? 'HARD DELETE (elimina filas)' : 'SOFT DELETE (estado_registro = 0)'}`)
    console.log('╚══════════════════════════════════════════════════╝\n');

    try {
        await sequelize.authenticate();
        console.log('Conexión a BD establecida.\n');

        // 1. Contar datos afectados
        const [prospectos] = await sequelize.query(
            `SELECT COUNT(*) as total FROM prospecto WHERE nombre_completo = 'Stress Test' AND estado_registro = 1`
        );
        const totalProspectos = prospectos[0]?.total || 0;

        const [mensajesMock] = await sequelize.query(
            `SELECT COUNT(*) as total FROM mensaje WHERE (wid_mensaje LIKE 'wamid.mock_%' OR wid_mensaje LIKE 'wamid.stress_%' OR wid_mensaje LIKE 'wamid.chaos_%') AND estado_registro = 1`
        );
        const totalMensajesMock = mensajesMock[0]?.total || 0;

        const [chats] = await sequelize.query(
            `SELECT COUNT(*) as total FROM chat WHERE id_prospecto IN (SELECT id FROM prospecto WHERE nombre_completo = 'Stress Test' OR LENGTH(celular) > 20) AND estado_registro = 1`
        );
        const totalChats = chats[0]?.total || 0;

        console.log('Datos encontrados:');
        console.log(`  Prospectos "Stress Test":  ${totalProspectos}`);
        console.log(`  Chats asociados:           ${totalChats}`);
        console.log(`  Mensajes mock/stress:      ${totalMensajesMock}`);
        console.log('');

        if (totalProspectos === 0 && totalMensajesMock === 0 && totalChats === 0) {
            console.log('No hay datos de stress test para limpiar.');
            await sequelize.close();
            return;
        }

        if (DRY_RUN) {
            console.log('[DRY RUN] No se realizaron cambios. Ejecuta sin --dry-run para limpiar.');
            await sequelize.close();
            return;
        }

        // 2. Limpiar en orden (mensajes → chats → prospectos) para respetar FK
        const t = await sequelize.transaction();

        try {
            let result;

            if (HARD_DELETE) {
                // --- HARD DELETE ---
                // Mensajes de chats de prospectos stress test
                result = await sequelize.query(
                    `DELETE FROM mensaje WHERE id_chat IN (
                        SELECT c.id FROM chat c
                        INNER JOIN prospecto p ON c.id_prospecto = p.id
                        WHERE p.nombre_completo = 'Stress Test'
                    )`,
                    { transaction: t }
                );
                console.log(`  [DELETE] Mensajes de chats stress: ${result[1]?.rowCount || 'OK'}`);

                // Mensajes sueltos con wid mock/stress/chaos (por si quedaron huérfanos)
                result = await sequelize.query(
                    `DELETE FROM mensaje WHERE wid_mensaje LIKE 'wamid.mock_%' OR wid_mensaje LIKE 'wamid.stress_%' OR wid_mensaje LIKE 'wamid.chaos_%'`,
                    { transaction: t }
                );
                console.log(`  [DELETE] Mensajes mock/stress/chaos sueltos: ${result[1]?.rowCount || 'OK'}`);

                // Chats
                result = await sequelize.query(
                    `DELETE FROM chat WHERE id_prospecto IN (SELECT id FROM prospecto WHERE nombre_completo = 'Stress Test' OR LENGTH(celular) > 20)`,
                    { transaction: t }
                );
                console.log(`  [DELETE] Chats: ${result[1]?.rowCount || 'OK'}`);

                // Prospectos (stress test + chaos test con phones largos)
                result = await sequelize.query(
                    `DELETE FROM prospecto WHERE nombre_completo = 'Stress Test' OR LENGTH(celular) > 20`,
                    { transaction: t }
                );
                console.log(`  [DELETE] Prospectos: ${result[1]?.rowCount || 'OK'}`);

            } else {
                // --- SOFT DELETE ---
                const now = new Date().toISOString();

                result = await sequelize.query(
                    `UPDATE mensaje SET estado_registro = 0, fecha_actualizacion = :now WHERE id_chat IN (
                        SELECT c.id FROM chat c
                        INNER JOIN prospecto p ON c.id_prospecto = p.id
                        WHERE p.nombre_completo = 'Stress Test'
                    ) AND estado_registro = 1`,
                    { replacements: { now }, transaction: t }
                );
                console.log(`  [SOFT DELETE] Mensajes de chats stress: ${result[1]?.rowCount || 'OK'}`);

                result = await sequelize.query(
                    `UPDATE mensaje SET estado_registro = 0, fecha_actualizacion = :now WHERE (wid_mensaje LIKE 'wamid.mock_%' OR wid_mensaje LIKE 'wamid.stress_%' OR wid_mensaje LIKE 'wamid.chaos_%') AND estado_registro = 1`,
                    { replacements: { now }, transaction: t }
                );
                console.log(`  [SOFT DELETE] Mensajes mock/stress/chaos sueltos: ${result[1]?.rowCount || 'OK'}`);

                result = await sequelize.query(
                    `UPDATE chat SET estado_registro = 0, fecha_actualizacion = :now WHERE id_prospecto IN (SELECT id FROM prospecto WHERE nombre_completo = 'Stress Test' OR LENGTH(celular) > 20) AND estado_registro = 1`,
                    { replacements: { now }, transaction: t }
                );
                console.log(`  [SOFT DELETE] Chats: ${result[1]?.rowCount || 'OK'}`);

                result = await sequelize.query(
                    `UPDATE prospecto SET estado_registro = 0, fecha_actualizacion = :now WHERE (nombre_completo = 'Stress Test' OR LENGTH(celular) > 20) AND estado_registro = 1`,
                    { replacements: { now }, transaction: t }
                );
                console.log(`  [SOFT DELETE] Prospectos: ${result[1]?.rowCount || 'OK'}`);
            }

            await t.commit();
            console.log('\nLimpieza completada exitosamente.');

        } catch (error) {
            await t.rollback();
            console.error('\nError durante la limpieza, se hizo ROLLBACK:', error.message);
        }

    } catch (error) {
        console.error('Error conectando a la BD:', error.message);
    } finally {
        await sequelize.close();
    }
}

limpiar();
