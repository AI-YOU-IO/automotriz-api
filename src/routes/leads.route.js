const { Router } = require("express");
const LeadsController = require("../controllers/leads.controller.js");
const EstadoProspectoController = require("../controllers/estadoProspecto.controller.js");

const router = Router();

router.get("/contactos/unread/count",
    // #swagger.tags = ['Contactos']
    // #swagger.summary = 'Obtener conteo de mensajes no leídos'
    (req, res) => res.status(200).json({ data: 0 })
);
router.get("/estados",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Obtener estados de prospecto'
    EstadoProspectoController.getEstadosProspecto
);
router.get("/leads",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Obtener todos los leads'
    LeadsController.getLeads
);
router.get("/leads/asesores",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Obtener asesores'
    LeadsController.getAsesores
);
router.get("/leads/catalogo",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Obtener catálogo'
    LeadsController.getCatalogo
);
router.get("/leads/:id",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Obtener lead por ID'
    LeadsController.getLeadById
);

router.get("/leads/:id/interacciones",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Obtener interacciones del lead'
    LeadsController.getInteracciones
);
router.put("/leads/:id",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Actualizar lead'
    LeadsController.updateLead
);
router.put("/leads/:id/asesor",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Asignar asesor a lead'
    LeadsController.assignAsesor
);
router.post("/leads/bulk-assign",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Asignación masiva de asesor'
    LeadsController.bulkAssignAsesor
);
router.post("/leads/sync-sperant",
    // #swagger.tags = ['Leads']
    // #swagger.summary = 'Sincronizar leads desde Sperant'
    LeadsController.syncFromSperant
);
router.post("/sync-sperant-all",
    // #swagger.tags = ['Sperant']
    // #swagger.summary = 'Sincronización completa desde Sperant (clientes)'
    LeadsController.syncAllFromSperant
);

module.exports = router;
