const { Router } = require("express");
const TicketController = require("../controllers/ticket.controller.js");

const router = Router();

router.get("/tickets/catalogos", TicketController.getCatalogos);
router.get("/tickets", TicketController.getAll);
router.get("/tickets/:id", TicketController.getById);
router.post("/tickets", TicketController.create);
router.get("/tickets/:id/comentarios", TicketController.getComentarios);
router.post("/tickets/:id/comentarios", TicketController.createComentario);
router.post("/tickets/:id/mark-read", TicketController.markAsRead);

module.exports = router;
