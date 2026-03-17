const { Router } = require("express");
const ReportesCrmController = require("../controllers/reportes.controller.js");

const router = Router();

// Reporte de embudo de ventas
router.get("/funnel",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener datos del embudo de ventas'
    ReportesCrmController.getFunnelData
);

// Estadisticas del dashboard
router.get("/dashboard",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener estadísticas del dashboard'
    ReportesCrmController.getDashboardStats
);

// Dashboard de WhatsApp (inicio)
router.get("/whatsapp-dashboard",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener estadísticas del dashboard WhatsApp'
    ReportesCrmController.getWhatsappDashboard
);

// Resumen general del dashboard
router.get("/resumen",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener datos del resumen general (KPIs, funnel, scoring, heatmap, etc.)'
    ReportesCrmController.getResumen
);

// Campanas WhatsApp con stats reales
router.get("/whatsapp-campanas",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener campanas WhatsApp con estadisticas'
    ReportesCrmController.getWhatsappCampanas
);

// Automatización - Campañas WS
router.get("/automatizacion/campanas",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener estadísticas de automatización de campañas WS'
    ReportesCrmController.getAutomatizacionCampanas
);

// Automatización - Recordatorios de cita
router.get("/automatizacion/recordatorios",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener estadísticas de recordatorios de cita'
    ReportesCrmController.getAutomatizacionRecordatorios
);

// Automatización - Mensajes de recuperación
router.get("/automatizacion/recuperacion",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener estadísticas de mensajes de recuperación'
    ReportesCrmController.getAutomatizacionRecuperacion
);

// Automatización - Segmentación de prospectos
router.get("/automatizacion/segmentar",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Segmentar prospectos por múltiples criterios'
    ReportesCrmController.getSegmentacion
);

// Consumo diario de conversaciones
router.get("/consumo",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener consumo diario de conversaciones para facturación'
    ReportesCrmController.getConsumo
);

// Consumo diario de llamadas (minutos facturables)
router.get("/consumo-llamadas",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener consumo diario de llamadas en minutos facturables'
    ReportesCrmController.getConsumoLlamadas
);

// Consumo histórico mes a mes (tendencia)
router.get("/consumo-historico",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener consumo histórico mes a mes para gráfica de tendencia'
    ReportesCrmController.getConsumoHistorico
);

// Speech Analytics (análisis de llamadas, sentimiento, preguntas)
router.get("/speech-analytics",
    // #swagger.tags = ['Reportes']
    // #swagger.summary = 'Obtener datos de Speech Analytics (FCR, sentimiento, emociones, preguntas, word cloud)'
    ReportesCrmController.getSpeechAnalytics
);

module.exports = router;
