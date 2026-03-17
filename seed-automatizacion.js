require('dotenv').config();
const { sequelize } = require('./src/models/sequelize/index.js');
const { QueryTypes } = require('sequelize');

(async () => {
  const t = await sequelize.transaction();
  try {
    const prosps = await sequelize.query(
      'SELECT id FROM prospecto WHERE estado_registro = 1 AND id_empresa = 1 ORDER BY id LIMIT 500',
      { type: QueryTypes.SELECT, transaction: t }
    );
    const pIds = prosps.map(r => r.id);
    console.log('Prospectos disponibles:', pIds.length);

    const chatsExist = await sequelize.query(
      'SELECT id, id_prospecto FROM chat WHERE estado_registro = 1',
      { type: QueryTypes.SELECT, transaction: t }
    );
    const chatMap = {};
    chatsExist.forEach(c => { chatMap[c.id_prospecto] = c.id; });
    console.log('Chats existentes:', chatsExist.length);

    // ============================
    // 1. RECORDATORIOS (150)
    // Columnas: id, cantidad, limite, id_prospecto, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion
    // ============================
    await sequelize.query(
      "SELECT setval('prospecto_recordatorio_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM prospecto_recordatorio), 1))",
      { transaction: t }
    );

    const recValues = [];
    for (let i = 0; i < 150; i++) {
      const pid = pIds[i];
      const mo = Math.floor(Math.random() * 10);
      const d = Math.floor(Math.random() * 28) + 1;
      const cant = Math.random() > 0.2 ? Math.floor(Math.random() * 3) + 1 : 0;
      recValues.push(
        `(${pid}, ${cant}, 3, 1, 1, NOW() - INTERVAL '${mo} months' - INTERVAL '${d} days', NOW() - INTERVAL '${mo} months' - INTERVAL '${d} days')`
      );
    }
    await sequelize.query(
      `INSERT INTO prospecto_recordatorio (id_prospecto, cantidad, limite, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion) VALUES ${recValues.join(',')}`,
      { transaction: t }
    );
    console.log('OK: 150 recordatorios');

    // ============================
    // 2. CITAS (100)
    // Columnas: id, nombre, hora_inicio, hora_fin, lugar, descripcion, id_prospecto, id_proyecto, id_unidad, id_estado_cita, id_usuario, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion, usuario_actualizacion
    // ============================
    await sequelize.query(
      "SELECT setval('cita_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM cita), 1))",
      { transaction: t }
    );

    const citaValues = [];
    for (let i = 0; i < 100; i++) {
      const pid = pIds[i + 50];
      const mo = Math.floor(Math.random() * 10);
      const d = Math.floor(Math.random() * 28) + 1;
      const reagendada = Math.random() < 0.4;
      const base = `NOW() - INTERVAL '${mo} months' - INTERVAL '${d} days'`;
      const upd = reagendada ? `${base} + INTERVAL '3 days'` : base;
      citaValues.push(
        `('Cita ${i + 1}', ${base}, ${base} + INTERVAL '1 hour', 'Oficina', 'Seguimiento', ${pid}, NULL, NULL, 1, 1, 1, 1, ${base}, ${upd}, 1)`
      );
    }
    await sequelize.query(
      `INSERT INTO cita (nombre, hora_inicio, hora_fin, lugar, descripcion, id_prospecto, id_proyecto, id_unidad, id_estado_cita, id_usuario, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion, usuario_actualizacion) VALUES ${citaValues.join(',')}`,
      { transaction: t }
    );
    console.log('OK: 100 citas');

    // ============================
    // 3. CHATS nuevos (para prospectos sin chat)
    // Columnas: id, id_prospecto, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion, usuario_actualizacion, bot_activo
    // ============================
    await sequelize.query(
      "SELECT setval('chat_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM chat), 1))",
      { transaction: t }
    );

    const propsWithoutChat = pIds.filter(pid => !chatMap[pid]).slice(0, 100);
    if (propsWithoutChat.length > 0) {
      const chatVals = propsWithoutChat.map(pid => {
        const mo = Math.floor(Math.random() * 10);
        return `(${pid}, 1, 1, NOW() - INTERVAL '${mo} months', NOW(), 1, 1)`;
      });
      await sequelize.query(
        `INSERT INTO chat (id_prospecto, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion, usuario_actualizacion, bot_activo) VALUES ${chatVals.join(',')}`,
        { transaction: t }
      );
      console.log('OK:', propsWithoutChat.length, 'chats nuevos');
    }

    const allChats = await sequelize.query(
      'SELECT id, id_prospecto FROM chat WHERE estado_registro = 1',
      { type: QueryTypes.SELECT, transaction: t }
    );
    console.log('Total chats:', allChats.length);

    // ============================
    // 4. MENSAJES
    // Columnas: id, direccion, tipo_mensaje, wid_mensaje, contenido, contenido_archivo, fecha_hora, id_usuario, id_chat, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion, usuario_actualizacion, id_plantilla_whatsapp
    // ============================
    await sequelize.query(
      "SELECT setval('mensaje_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM mensaje), 1))",
      { transaction: t }
    );

    const msgVals = [];
    for (const chat of allChats.slice(0, 80)) {
      const mo = Math.floor(Math.random() * 10);
      const ts1 = `NOW() - INTERVAL '${mo} months' - INTERVAL '2 days'`;
      const ts2 = `NOW() - INTERVAL '${mo} months' - INTERVAL '1 day'`;
      const ts3 = `NOW() - INTERVAL '${mo} months' - INTERVAL '5 days'`;

      // Mensaje out con plantilla WS
      msgVals.push(
        `('out', 'text', NULL, 'Mensaje de campaña', NULL, ${ts1}, NULL, ${chat.id}, 1, 1, ${ts1}, ${ts1}, 1, 1)`
      );

      // 60% respuesta in
      if (Math.random() < 0.6) {
        msgVals.push(
          `('in', 'text', NULL, 'Gracias por la info', NULL, ${ts2}, NULL, ${chat.id}, 1, 1, ${ts2}, ${ts2}, 1, NULL)`
        );
      }

      // 30% out sin respuesta (abandonado)
      if (Math.random() < 0.3) {
        msgVals.push(
          `('out', 'text', NULL, 'Seguimos pendientes', NULL, ${ts3}, NULL, ${chat.id}, 1, 1, ${ts3}, ${ts3}, 1, NULL)`
        );
      }
    }

    if (msgVals.length > 0) {
      await sequelize.query(
        `INSERT INTO mensaje (direccion, tipo_mensaje, wid_mensaje, contenido, contenido_archivo, fecha_hora, id_usuario, id_chat, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion, usuario_actualizacion, id_plantilla_whatsapp) VALUES ${msgVals.join(',')}`,
        { transaction: t }
      );
      console.log('OK:', msgVals.length, 'mensajes');
    }

    // Desactivar bot en 15 chats (desuscritos)
    const deactivate = allChats.slice(0, 15).map(c => c.id);
    await sequelize.query(
      `UPDATE chat SET bot_activo = 0 WHERE id IN (${deactivate.join(',')})`,
      { transaction: t }
    );
    console.log('OK: bot desactivado en', deactivate.length, 'chats');

    await t.commit();
    console.log('\n=== SEED COMPLETADO ===\n');

    // Verificar
    const r1 = await sequelize.query('SELECT COUNT(*) as t FROM prospecto_recordatorio WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    const r2 = await sequelize.query('SELECT COUNT(*) as t FROM cita WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    const r3 = await sequelize.query('SELECT COUNT(*) as t FROM chat WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    const r4 = await sequelize.query('SELECT COUNT(*) as t FROM mensaje WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    console.log('Recordatorios:', r1[0].t);
    console.log('Citas:', r2[0].t);
    console.log('Chats:', r3[0].t);
    console.log('Mensajes:', r4[0].t);

    await sequelize.close();
  } catch (err) {
    await t.rollback();
    console.error('ERROR:', err.message);
    console.error(err.stack);
    await sequelize.close();
    process.exit(1);
  }
})();
