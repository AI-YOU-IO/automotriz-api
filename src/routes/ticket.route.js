const { Router } = require("express");
const multer = require("multer");
const TicketController = require("../controllers/ticket.controller.js");

const router = Router();

const uploadFiles = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.get("/tickets/catalogos", TicketController.getCatalogos);
router.get("/tickets", TicketController.getAll);
router.get("/tickets/:id", TicketController.getById);
router.post("/tickets", TicketController.create);
router.get("/tickets/:id/comentarios", TicketController.getComentarios);
router.post("/tickets/:id/comentarios", uploadFiles.array('archivos', 5), TicketController.createComentario);
router.post("/tickets/:id/mark-read", TicketController.markAsRead);

module.exports = router;
