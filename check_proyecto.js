require('dotenv').config();
const proyectoRepository = require('./src/repositories/proyecto.repository');

(async () => {
  try {
    const proyectos = await proyectoRepository.findAll(1);
    proyectos.forEach(p => {
      console.log(`Proyecto: ${p.nombre} | imagen: ${p.imagen} | imagen_principal: ${p.imagen_principal}`);
    });
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
