const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Viva API',
    description: 'API de Viva - CRM y Asistente IA',
    version: '1.0.0',
  },
  host: `localhost:${process.env.PORT || 3020}`,
  basePath: '/',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'JWT Token (Bearer <token>)',
    },
    apiKey: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'API Key (Bearer <api_key>)',
    },
  },
  tags: [
    { name: 'Auth', description: 'Autenticacion' },
    { name: 'Usuario', description: 'Gestion de usuarios' },
    { name: 'Rol', description: 'Gestion de roles' },
    { name: 'Modulo', description: 'Gestion de modulos' },
    { name: 'Sucursal', description: 'Gestion de sucursales' },
    { name: 'Leads', description: 'Gestion de leads' },
    { name: 'Reportes', description: 'Generacion de reportes' },
    { name: 'FAQs', description: 'Preguntas frecuentes' },
    { name: 'Tipificacion', description: 'Gestion de tipificaciones' },
    { name: 'Recordatorio', description: 'Periodicidad de recordatorios' },
    { name: 'Plantilla', description: 'Gestion de plantillas' },
    { name: 'Campaña', description: 'Gestion de campañas' },
    { name: 'Empresa', description: 'Gestion de empresas' },
    { name: 'CampaniaEjecucion', description: 'Ejecuciones de campañas' },
    { name: 'CampaniaProspectos', description: 'Prospectos de campañas' },
    { name: 'Chat', description: 'Gestion de chats' },
    { name: 'Cita', description: 'Gestion de citas' },
    { name: 'EstadoCita', description: 'Estados de cita' },
    { name: 'EstadoLlamada', description: 'Estados de llamada' },
    { name: 'EstadoProspecto', description: 'Estados de prospecto' },
    { name: 'Interaccion', description: 'Gestion de interacciones' },
    { name: 'Llamada', description: 'Gestion de llamadas' },
    { name: 'Mensaje', description: 'Gestion de mensajes' },
    { name: 'MensajeVistoUsuario', description: 'Mensajes vistos por usuario' },
    { name: 'Prospecto', description: 'Gestion de prospectos' },
    { name: 'ProspectoRecordatorio', description: 'Recordatorios de prospectos' },
    { name: 'Marca', description: 'Gestion de marcas' },
    { name: 'Modelo', description: 'Gestion de modelos' },
    { name: 'Version', description: 'Gestion de versiones' },
    { name: 'RolModulo', description: 'Relacion rol-modulo' },
    { name: 'Speaker', description: 'Gestion de speakers' },
    { name: 'Transcripcion', description: 'Gestion de transcripciones' },
    { name: 'Assistant', description: 'Asistente IA' },
  ],
};

const outputFile = './src/config/swagger-output.json';
const endpointsFiles = ['./src/app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
