const { Router } = require("express");
const ConversacionController = require("../controllers/conversacion.controller.js");

const router = Router();

router.get("/contactos/unread/count",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Obtener conteo de mensajes no leídos (placeholder)'
    (req, res) => res.status(200).json({ data: 0 })
);

router.get("/contactos/buscar/:query",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Buscar contactos por nombre o celular'
    ConversacionController.buscarContactos
);

router.get("/contactos/:offset",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Listar contactos con último mensaje y no leídos'
    ConversacionController.getContactos
);

router.get("/contacto/:id/mensajes",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Obtener mensajes de un contacto'
    ConversacionController.getMensajes
);

router.post("/contacto/:id/mensajes",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Enviar mensaje a un contacto'
    ConversacionController.enviarMensaje
);

router.post("/contacto/:id/mark-read",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Marcar mensajes como leídos'
    ConversacionController.markRead
);

router.patch("/contacto/:id/toggle-bot",
    // #swagger.tags = ['Conversaciones']
    // #swagger.summary = 'Activar/desactivar bot para un contacto'
    ConversacionController.toggleBot
);

module.exports = router;
