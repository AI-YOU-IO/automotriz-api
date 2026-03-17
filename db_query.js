const { Sequelize } = require('sequelize');
const seq = new Sequelize('viva', 'postgres', '2dcadb647e771cc6228d', {
  host: '167.172.254.139', port: 5432, dialect: 'postgres', logging: false
});

async function run() {
  try {
    await seq.authenticate();

    const estados = [
      { nombre: 'Programado', color: '3b82f6', orden: 1 },
      { nombre: 'Asistido', color: '22c55e', orden: 2 },
      { nombre: 'No Asistido', color: 'ef4444', orden: 3 },
      { nombre: 'Cancelado', color: '6b7280', orden: 4 },
      { nombre: 'Reprogramado', color: 'f59e0b', orden: 5 },
    ];

    for (const e of estados) {
      await seq.query(
        "INSERT INTO estado_cita (nombre, color, orden, id_empresa, estado_registro, usuario_registro, usuario_actualizacion, fecha_registro, fecha_actualizacion) VALUES ($1, $2, $3, 1, 1, 1, 1, NOW(), NOW())",
        { bind: [e.nombre, e.color, e.orden] }
      );
      console.log(`Insertado: ${e.nombre} (${e.color})`);
    }

    console.log('\n=== ESTADOS FINALES ===');
    const [rows] = await seq.query("SELECT id, nombre, color, orden FROM estado_cita WHERE estado_registro = 1 ORDER BY orden");
    rows.forEach(r => console.log(JSON.stringify(r)));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await seq.close();
  }
}
run();
