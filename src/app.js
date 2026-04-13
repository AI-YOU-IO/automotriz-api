const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

// Swagger solo en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';
let swaggerUi, swaggerDocument;
if (isDevelopment) {
  swaggerUi = require('swagger-ui-express');
  swaggerDocument = require('./config/swagger-output.json');
}

const messageProcessingRoutes = require('./routes/messageProcessing.route.js');
const { responseHandler } = require('./middlewares/response.middleware.js');
const authMiddleware = require('./middlewares/auth.middleware.js');
const authRoute = require("./routes/auth.route.js");
const reporteRoutes = require('./routes/reportes.route.js');
const usuarioRoutes = require("./routes/usuario.route.js");
const leadsRoutes = require("./routes/leads.route.js");
const rolRoutes = require("./routes/rol.route.js");
const moduloRoutes = require("./routes/modulo.route.js");
const sucursalRoutes = require("./routes/sucursal.route.js");
const faqRoutes = require("./routes/faq.route.js");
const tipificacionRoutes = require("./routes/tipificacion.route.js");
const periodicidadRecordatorioRoutes = require("./routes/periodicidadRecordatorio.route.js");
const plantillaRoutes = require("./routes/plantilla.route.js");
const campaniaRoutes = require("./routes/campania.route.js");
const empresaRoutes = require("./routes/empresa.route.js");
const campaniaEjecucionRoutes = require("./routes/campaniaEjecucion.route.js");
const campaniaProspectosRoutes = require("./routes/campaniaProspectos.route.js");
const chatRoutes = require("./routes/chat.route.js");
const citaRoutes = require("./routes/cita.route.js");
const estadoCitaRoutes = require("./routes/estadoCita.route.js");
const estadoLlamadaRoutes = require("./routes/estadoLlamada.route.js");
const estadoProspectoRoutes = require("./routes/estadoProspecto.route.js");
const interaccionRoutes = require("./routes/interaccion.route.js");
const llamadaRoutes = require("./routes/llamada.route.js");
const mensajeRoutes = require("./routes/mensaje.route.js");
const mensajeVistoUsuarioRoutes = require("./routes/mensajeVistoUsuario.route.js");
const prospectoRoutes = require("./routes/prospecto.route.js");
const prospectoRecordatorioRoutes = require("./routes/prospectoRecordatorio.route.js");
const rolModuloRoutes = require("./routes/rolModulo.route.js");
const speakerRoutes = require("./routes/speaker.route.js");
const formatoRoutes = require("./routes/formato.route.js");
const transcripcionRoutes = require("./routes/transcripcion.route.js");
const diaDescansoRoutes = require("./routes/diaDescanso.route.js");
const conversacionRoutes = require("./routes/conversacion.route.js");
const plantillaWhatsappRoutes = require("./routes/plantillaWhatsapp.route.js");
const whatsappEmbeddedRoutes = require("./routes/whatsappEmbedded.route.js");
const configuracionWhatsappRoutes = require("./routes/configuracionWhatsapp.route.js");
const envioMasivoWhatsappRoutes = require("./routes/envioMasivoWhatsapp.route.js");
const enviosProspectosRoutes = require("./routes/enviosProspectos.route.js");
const n8nEnvioMasivoRoutes = require("./routes/n8nEnvioMasivo.route.js");
const n8nProspectoRoutes = require("./routes/n8nProspecto.route.js");
const n8nMensajeRoutes = require("./routes/n8nMensaje.route.js");
const n8nChatRoutes = require("./routes/n8nChat.route.js");
const n8nCitaRoutes = require("./routes/n8nCita.route.js");
const n8nRecuperacionRoutes = require("./routes/n8nRecuperacion.route.js");
const n8nEmpresaRoutes = require("./routes/n8nEmpresa.route.js");
const n8nPlantillaBitrixRoutes = require("./routes/n8nPlantillaBitrix.route.js");
const n8nGqmLeadRoutes = require("./routes/n8nGqmLead.route.js");
const wsNotifyRoutes = require("./routes/wsNotify.route.js");
const whatsappMensajeRoutes = require("./routes/whatsappMensaje.route.js");
const tipoCampaniaRoutes = require("./routes/tipoCampania.route.js");
const estadoCampaniaRoutes = require("./routes/estadoCampania.route.js");
const recursoRoutes = require("./routes/recurso.route.js");
const tipoRecursoRoutes = require("./routes/tipoRecurso.route.js");
const distritoRoutes = require("./routes/distrito.route.js");
const promptAsistenteRoutes = require("./routes/promptAsistente.route.js");
const campoSistemaRoutes = require("./routes/campoSistema.route.js");
const marcaRoutes = require("./routes/marca.route.js");
const modeloRoutes = require("./routes/modelo.route.js");
const versionRoutes = require("./routes/version.route.js");
const horarioAtencionRoutes = require("./routes/horarioAtencion.route.js");
const horarioBloqueadoRoutes = require("./routes/horarioBloqueado.route.js");
const toolRoutes = require("./routes/tool.route.js");
const ultravoxRoutes = require("./routes/ultravox.route.js");
const ticketRoutes = require("./routes/ticket.route.js");
const getEventWebhook = require("../webhook/getEvent.js");

const app = express();

// CORS - permitir todas las peticiones (debe ir primero)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// Middleware de seguridad (configurado para permitir CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware para parsing
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Servir archivos subidos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Middleware para respuestas JSON consistentes
app.use(responseHandler);

// Swagger UI solo en desarrollo
if (isDevelopment) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Rutas
app.use('/api', reporteRoutes);
app.use("/api/crm", authRoute);

// Rutas CRM (protegidas con auth)
app.use("/api/crm", authMiddleware, rolRoutes, usuarioRoutes, moduloRoutes, sucursalRoutes,
  faqRoutes, tipificacionRoutes, periodicidadRecordatorioRoutes, plantillaRoutes, campaniaRoutes,
  empresaRoutes, campaniaEjecucionRoutes, campaniaProspectosRoutes, chatRoutes, citaRoutes,
  estadoCitaRoutes, estadoLlamadaRoutes, estadoProspectoRoutes, interaccionRoutes, llamadaRoutes,
  mensajeRoutes, mensajeVistoUsuarioRoutes, prospectoRoutes, prospectoRecordatorioRoutes,
  rolModuloRoutes, speakerRoutes, formatoRoutes,
  transcripcionRoutes, leadsRoutes, diaDescansoRoutes, conversacionRoutes,
  plantillaWhatsappRoutes, whatsappEmbeddedRoutes, configuracionWhatsappRoutes,
  envioMasivoWhatsappRoutes, enviosProspectosRoutes,
  tipoCampaniaRoutes, estadoCampaniaRoutes, recursoRoutes, tipoRecursoRoutes, distritoRoutes,
  promptAsistenteRoutes, campoSistemaRoutes, marcaRoutes, modeloRoutes, versionRoutes,
  horarioAtencionRoutes, horarioBloqueadoRoutes, toolRoutes,
  ticketRoutes
);

// Rutas del asistente IA (protegidas con API Key)
app.use('/api/assistant', messageProcessingRoutes);

// Rutas n8n (protegidas con API Key propia)
app.use('/api/n8n', n8nEnvioMasivoRoutes);
app.use('/api/n8n/prospectos', n8nProspectoRoutes);
app.use('/api/n8n/mensajes', n8nMensajeRoutes);
app.use('/api/n8n/chats', n8nChatRoutes);
app.use('/api/n8n/citas', n8nCitaRoutes);
app.use('/api/n8n/recuperacion', n8nRecuperacionRoutes);
app.use('/api/n8n/empresa', n8nEmpresaRoutes);
app.use('/api/n8n/plantilla-bitrix', n8nPlantillaBitrixRoutes);
app.use('/api/n8n/gqm-leads', n8nGqmLeadRoutes);

// Rutas WebSocket notify (para servicios externos: agente IA, etc.)
app.use('/api/ws-notify', wsNotifyRoutes);

// Rutas Ultravox webhook (protegidas con Bearer token)
app.use('/api/ultravox', ultravoxRoutes);

// Rutas WhatsApp mensaje (pública - para envío desde N8N/webhooks)
app.use('/api/whatsapp-mensaje', whatsappMensajeRoutes);

// Webhook para recibir eventos externos
app.use('/webhook', getEventWebhook);

// Ruta de health check
app.get('/health', (req, res) => {
  res.success(200, 'Health check');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.clientError(404, 'Ruta no encontrada');
});


module.exports = app;
