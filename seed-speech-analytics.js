require('dotenv').config();
const { sequelize } = require('./src/models/sequelize/index.js');
const { QueryTypes } = require('sequelize');

(async () => {
  const t = await sequelize.transaction();
  try {
    // 1. Crear tabla analisis_llamada
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS analisis_llamada (
        id SERIAL PRIMARY KEY,
        id_llamada INTEGER NOT NULL REFERENCES llamada(id),
        total_tokens INTEGER DEFAULT 0,
        total_palabras INTEGER DEFAULT 0,
        tiempo_habla_seg INTEGER DEFAULT 0,
        tiempo_silencio_seg INTEGER DEFAULT 0,
        cumplimiento_protocolo FLOAT DEFAULT 0,
        fcr BOOLEAN DEFAULT FALSE,
        id_empresa INTEGER NOT NULL REFERENCES empresa(id),
        estado_registro INTEGER NOT NULL DEFAULT 1,
        usuario_registro INTEGER NOT NULL DEFAULT 1,
        usuario_actualizacion INTEGER NOT NULL DEFAULT 1,
        fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
        fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `, { transaction: t });
    console.log('OK: tabla analisis_llamada creada');

    // 2. Crear tabla analisis_sentimiento
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS analisis_sentimiento (
        id SERIAL PRIMARY KEY,
        id_llamada INTEGER NOT NULL REFERENCES llamada(id),
        sentimiento VARCHAR(20) NOT NULL,
        score_sentimiento FLOAT DEFAULT 0,
        emocion_principal VARCHAR(30),
        score_emocion FLOAT DEFAULT 0,
        id_empresa INTEGER NOT NULL REFERENCES empresa(id),
        estado_registro INTEGER NOT NULL DEFAULT 1,
        usuario_registro INTEGER NOT NULL DEFAULT 1,
        usuario_actualizacion INTEGER NOT NULL DEFAULT 1,
        fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
        fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `, { transaction: t });
    console.log('OK: tabla analisis_sentimiento creada');

    // 3. Crear tabla pregunta_frecuente
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS pregunta_frecuente (
        id SERIAL PRIMARY KEY,
        id_llamada INTEGER NOT NULL REFERENCES llamada(id),
        tipo VARCHAR(20) NOT NULL,
        contenido VARCHAR(255) NOT NULL,
        frecuencia INTEGER NOT NULL DEFAULT 1,
        id_empresa INTEGER NOT NULL REFERENCES empresa(id),
        estado_registro INTEGER NOT NULL DEFAULT 1,
        usuario_registro INTEGER NOT NULL DEFAULT 1,
        usuario_actualizacion INTEGER NOT NULL DEFAULT 1,
        fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
        fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `, { transaction: t });
    console.log('OK: tabla pregunta_frecuente creada');

    // 4. Crear tabla speaker si no existe
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS speaker (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        estado_registro INTEGER NOT NULL DEFAULT 1,
        usuario_registro INTEGER NOT NULL DEFAULT 1,
        usuario_actualizacion INTEGER NOT NULL DEFAULT 1,
        fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
        fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `, { transaction: t });
    console.log('OK: tabla speaker creada');

    // 5. Agregar columnas a transcripcion
    const cols = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'transcripcion'",
      { type: QueryTypes.SELECT, transaction: t }
    );
    const colNames = cols.map(c => c.column_name);

    if (!colNames.includes('id_speaker')) {
      await sequelize.query('ALTER TABLE transcripcion ADD COLUMN id_speaker INTEGER REFERENCES speaker(id)', { transaction: t });
      console.log('OK: columna id_speaker agregada a transcripcion');
    } else {
      console.log('SKIP: id_speaker ya existe en transcripcion');
    }

    if (!colNames.includes('inicio_seg')) {
      await sequelize.query('ALTER TABLE transcripcion ADD COLUMN inicio_seg FLOAT', { transaction: t });
      console.log('OK: columna inicio_seg agregada a transcripcion');
    } else {
      console.log('SKIP: inicio_seg ya existe en transcripcion');
    }

    if (!colNames.includes('fin_seg')) {
      await sequelize.query('ALTER TABLE transcripcion ADD COLUMN fin_seg FLOAT', { transaction: t });
      console.log('OK: columna fin_seg agregada a transcripcion');
    } else {
      console.log('SKIP: fin_seg ya existe en transcripcion');
    }

    // 6. Insertar estados de llamada si no existen
    const estados = await sequelize.query(
      'SELECT COUNT(*) as t FROM estado_llamada WHERE estado_registro = 1',
      { type: QueryTypes.SELECT, transaction: t }
    );
    if (parseInt(estados[0].t) === 0) {
      await sequelize.query(`
        INSERT INTO estado_llamada (nombre, id_empresa, estado_registro, usuario_registro, usuario_actualizacion, fecha_registro, fecha_actualizacion)
        VALUES
          ('Completada', 1, 1, 1, 1, NOW(), NOW()),
          ('En progreso', 1, 1, 1, 1, NOW(), NOW()),
          ('Fallida', 1, 1, 1, 1, NOW(), NOW()),
          ('Sin contestar', 1, 1, 1, 1, NOW(), NOW())
      `, { transaction: t });
      console.log('OK: 4 estados de llamada insertados');
    } else {
      console.log('SKIP: estado_llamada ya tiene registros');
    }

    await t.commit();
    console.log('\n=== SPEECH ANALYTICS TABLES CREADAS ===\n');

    // Verificar
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('analisis_llamada', 'analisis_sentimiento', 'pregunta_frecuente')",
      { type: QueryTypes.SELECT }
    );
    console.log('Tablas creadas:', tables.map(t => t.table_name).join(', '));

    const transcCols = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'transcripcion' AND column_name IN ('id_speaker', 'inicio_seg', 'fin_seg')",
      { type: QueryTypes.SELECT }
    );
    console.log('Columnas nuevas en transcripcion:', transcCols.map(c => c.column_name).join(', '));

    const el = await sequelize.query('SELECT COUNT(*) as t FROM estado_llamada WHERE estado_registro = 1', { type: QueryTypes.SELECT });
    console.log('Estados de llamada:', el[0].t);

    await sequelize.close();
  } catch (err) {
    await t.rollback();
    console.error('ERROR:', err.message);
    console.error(err.stack);
    await sequelize.close();
    process.exit(1);
  }
})();
