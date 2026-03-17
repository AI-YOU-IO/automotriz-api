const { Client } = require('pg');
const c = new Client({ host:'167.172.254.139', user:'postgres', password:'2dcadb647e771cc6228d', database:'viva', port:5432 });
async function run() {
  await c.connect();
  const r = await c.query("SELECT id, provider_call_id, id_prospecto, id_estado_llamada, fecha_inicio, id_campania_ejecucion FROM llamada ORDER BY id DESC LIMIT 5");
  console.log('Ultimas llamadas:');
  r.rows.forEach(row => console.log(JSON.stringify(row)));
  await c.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
