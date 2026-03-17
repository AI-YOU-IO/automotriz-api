require('dotenv').config();
const { sequelize } = require('./src/models/sequelize/index.js');
const { QueryTypes } = require('sequelize');

(async () => {
  const t = await sequelize.transaction();
  try {
    // Obtener prospectos disponibles
    const prosps = await sequelize.query(
      'SELECT id FROM prospecto WHERE estado_registro = 1 AND id_empresa = 1 ORDER BY id LIMIT 200',
      { type: QueryTypes.SELECT, transaction: t }
    );
    const pIds = prosps.map(r => r.id);
    console.log('Prospectos disponibles:', pIds.length);

    // Reset sequences
    await sequelize.query("SELECT setval('llamada_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM llamada), 1))", { transaction: t });
    await sequelize.query("SELECT setval('analisis_llamada_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM analisis_llamada), 1))", { transaction: t });
    await sequelize.query("SELECT setval('analisis_sentimiento_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM analisis_sentimiento), 1))", { transaction: t });
    await sequelize.query("SELECT setval('pregunta_frecuente_id_seq', GREATEST((SELECT COALESCE(MAX(id),0) FROM pregunta_frecuente), 1))", { transaction: t });

    // ============================
    // 1. LLAMADAS (200)
    // ============================
    const llamadaVals = [];
    for (let i = 0; i < 200; i++) {
      const pid = pIds[i];
      const mo = Math.floor(Math.random() * 10); // 0-9 meses atrás
      const d = Math.floor(Math.random() * 28) + 1;
      const h = Math.floor(Math.random() * 10) + 8; // 8am - 17pm
      const duracion = Math.floor(Math.random() * 300) + 60; // 60-360 seg
      const base = `NOW() - INTERVAL '${mo} months' - INTERVAL '${d} days'`;
      llamadaVals.push(
        `(NULL, ${base} + INTERVAL '${h} hours', ${base} + INTERVAL '${h} hours' + INTERVAL '${duracion} seconds', ${duracion}, NULL, NULL, 1, ${pid}, 1, 1, 1, 1, ${base}, ${base})`
      );
    }
    await sequelize.query(
      `INSERT INTO llamada (provider_call_id, fecha_inicio, fecha_fin, duracion_seg, metadata_json, url_audio, id_estado_llamada, id_prospecto, id_empresa, estado_registro, usuario_registro, usuario_actualizacion, fecha_registro, fecha_actualizacion) VALUES ${llamadaVals.join(',')}`,
      { transaction: t }
    );
    console.log('OK: 200 llamadas insertadas');

    // Obtener IDs de llamadas insertadas
    const llamadas = await sequelize.query(
      'SELECT id, fecha_inicio, duracion_seg FROM llamada WHERE estado_registro = 1 ORDER BY id',
      { type: QueryTypes.SELECT, transaction: t }
    );
    console.log('Llamadas en BD:', llamadas.length);

    // ============================
    // 2. ANALISIS_LLAMADA (1 por llamada)
    // ============================
    const analisisVals = [];
    for (const ll of llamadas) {
      const fcr = Math.random() < 0.7; // 70% FCR
      analisisVals.push(
        `(${ll.id}, NULL, NULL, NULL, NULL, NULL, ${fcr}, 1, 1, 1, 1, NOW(), NOW())`
      );
    }
    await sequelize.query(
      `INSERT INTO analisis_llamada (id_llamada, total_tokens, total_palabras, tiempo_habla_seg, tiempo_silencio_seg, cumplimiento_protocolo, fcr, id_empresa, estado_registro, usuario_registro, usuario_actualizacion, fecha_registro, fecha_actualizacion) VALUES ${analisisVals.join(',')}`,
      { transaction: t }
    );
    console.log('OK:', analisisVals.length, 'analisis_llamada insertados');

    // ============================
    // 3. ANALISIS_SENTIMIENTO (1 por llamada)
    // Distribución: 45% positivo, 25% negativo, 30% neutro
    // ============================
    const sentimientos = ['positivo', 'negativo', 'neutro'];
    const emocionesPorSentimiento = {
      positivo: ['satisfaccion', 'gratitud', 'entusiasmo', 'confianza'],
      negativo: ['frustracion', 'enojo', 'confusion', 'ansiedad', 'desconfianza', 'decepcion'],
      neutro: ['indiferencia', 'curiosidad', 'calma']
    };
    const sentimientoVals = [];

    for (const ll of llamadas) {
      const r = Math.random();
      let sent;
      if (r < 0.45) sent = 'positivo';
      else if (r < 0.70) sent = 'negativo';
      else sent = 'neutro';

      const score = sent === 'positivo' ? (Math.random() * 0.5 + 0.5).toFixed(2)
                  : sent === 'negativo' ? (Math.random() * -0.5 - 0.5).toFixed(2)
                  : (Math.random() * 0.4 - 0.2).toFixed(2);

      const emociones = emocionesPorSentimiento[sent];
      // Ponderar: primera emoción más probable
      const weights = emociones.map((_, i) => Math.max(1, emociones.length - i));
      const totalW = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalW;
      let emocion = emociones[0];
      for (let i = 0; i < weights.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { emocion = emociones[i]; break; }
      }
      const scoreEmo = (Math.random() * 0.4 + 0.6).toFixed(2);

      sentimientoVals.push(
        `(${ll.id}, '${sent}', ${score}, '${emocion}', ${scoreEmo}, 1, 1, 1, 1, NOW(), NOW())`
      );
    }
    await sequelize.query(
      `INSERT INTO analisis_sentimiento (id_llamada, sentimiento, score_sentimiento, emocion_principal, score_emocion, id_empresa, estado_registro, usuario_registro, usuario_actualizacion, fecha_registro, fecha_actualizacion) VALUES ${sentimientoVals.join(',')}`,
      { transaction: t }
    );
    console.log('OK:', sentimientoVals.length, 'analisis_sentimiento insertados');

    // ============================
    // 4. PREGUNTA_FRECUENTE
    // ============================
    const preguntas = [
      '¿Cuál es el precio del departamento?',
      '¿Tienen disponibilidad?',
      '¿Cuáles son las formas de pago?',
      '¿Dónde está ubicado el proyecto?',
      '¿Cuándo es la fecha de entrega?',
      '¿Tienen estacionamiento incluido?',
      '¿Puedo agendar una visita?',
      '¿Ofrecen financiamiento bancario?',
      '¿Cuántos metros cuadrados tiene?',
      '¿Tienen departamentos de 3 dormitorios?'
    ];
    const temas = [
      'Precios y financiamiento',
      'Disponibilidad de unidades',
      'Ubicación del proyecto',
      'Características del inmueble',
      'Proceso de compra',
      'Fechas de entrega',
      'Visitas y citas',
      'Documentación requerida'
    ];
    const palabras = [
      'precio', 'departamento', 'disponibilidad', 'pago', 'financiamiento',
      'ubicación', 'entrega', 'visita', 'metros', 'dormitorios',
      'estacionamiento', 'banco', 'cuota', 'inicial', 'proyecto',
      'planos', 'acabados', 'vista', 'piso', 'cochera'
    ];

    const pregVals = [];
    // Preguntas: distribuir entre llamadas
    for (const ll of llamadas) {
      // Cada llamada tiene 1-3 preguntas
      const numPregs = Math.floor(Math.random() * 3) + 1;
      const used = new Set();
      for (let i = 0; i < numPregs; i++) {
        let idx;
        do { idx = Math.floor(Math.random() * preguntas.length); } while (used.has(idx));
        used.add(idx);
        const freq = Math.floor(Math.random() * 3) + 1;
        pregVals.push(`(${ll.id}, 'pregunta', '${preguntas[idx].replace(/'/g, "''")}', ${freq}, 1, 1, 1, 1, NOW(), NOW())`);
      }
    }
    // Temas: distribuir entre llamadas
    for (const ll of llamadas) {
      const numTemas = Math.floor(Math.random() * 2) + 1;
      const used = new Set();
      for (let i = 0; i < numTemas; i++) {
        let idx;
        do { idx = Math.floor(Math.random() * temas.length); } while (used.has(idx));
        used.add(idx);
        const freq = Math.floor(Math.random() * 3) + 1;
        pregVals.push(`(${ll.id}, 'tema', '${temas[idx]}', ${freq}, 1, 1, 1, 1, NOW(), NOW())`);
      }
    }
    // Palabras: distribuir entre llamadas
    for (const ll of llamadas) {
      const numPals = Math.floor(Math.random() * 4) + 2;
      const used = new Set();
      for (let i = 0; i < numPals; i++) {
        let idx;
        do { idx = Math.floor(Math.random() * palabras.length); } while (used.has(idx));
        used.add(idx);
        const freq = Math.floor(Math.random() * 5) + 1;
        pregVals.push(`(${ll.id}, 'palabra', '${palabras[idx]}', ${freq}, 1, 1, 1, 1, NOW(), NOW())`);
      }
    }

    // Insertar en batches de 500
    for (let i = 0; i < pregVals.length; i += 500) {
      const batch = pregVals.slice(i, i + 500);
      await sequelize.query(
        `INSERT INTO pregunta_frecuente (id_llamada, tipo, contenido, frecuencia, id_empresa, estado_registro, usuario_registro, usuario_actualizacion, fecha_registro, fecha_actualizacion) VALUES ${batch.join(',')}`,
        { transaction: t }
      );
    }
    console.log('OK:', pregVals.length, 'pregunta_frecuente insertados');

    await t.commit();
    console.log('\n=== SEED SPEECH DATA COMPLETADO ===\n');

    // Verificar
    const r1 = await sequelize.query('SELECT COUNT(*) as t FROM llamada WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    const r2 = await sequelize.query('SELECT COUNT(*) as t FROM analisis_llamada WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    const r3 = await sequelize.query('SELECT COUNT(*) as t FROM analisis_sentimiento WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    const r4 = await sequelize.query('SELECT COUNT(*) as t FROM pregunta_frecuente WHERE estado_registro = 1', { type: QueryTypes.SELECT });

    // Distribución de sentimientos
    const dist = await sequelize.query(
      "SELECT sentimiento, COUNT(*) as total FROM analisis_sentimiento WHERE estado_registro = 1 GROUP BY sentimiento ORDER BY total DESC",
      { type: QueryTypes.SELECT }
    );

    console.log('Llamadas:', r1[0].t);
    console.log('Analisis llamada:', r2[0].t);
    console.log('Analisis sentimiento:', r3[0].t);
    console.log('Pregunta frecuente:', r4[0].t);
    console.log('\nDistribución sentimientos:');
    dist.forEach(d => console.log(`  ${d.sentimiento}: ${d.total}`));

    await sequelize.close();
  } catch (err) {
    await t.rollback();
    console.error('ERROR:', err.message);
    console.error(err.stack);
    await sequelize.close();
    process.exit(1);
  }
})();
