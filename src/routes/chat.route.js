const { Router } = require("express");
const ChatController = require("../controllers/chat.controller.js");

const router = Router();

router.get("/chats", /* #swagger.tags = ['Chat'] */ ChatController.getChats);
router.get("/chats/:id", /* #swagger.tags = ['Chat'] */ ChatController.getChatById);
router.post("/chats", /* #swagger.tags = ['Chat'] */ ChatController.createChat);
router.put("/chats/:id", /* #swagger.tags = ['Chat'] */ ChatController.updateChat);
router.delete("/chats/:id", /* #swagger.tags = ['Chat'] */ ChatController.deleteChat);

module.exports = router;
