const { Router } = require("express");
const ProyectoController = require("../controllers/proyecto.controller.js");

const router = Router();

router.get("/proyectos", /* #swagger.tags = ['Proyecto'] */ ProyectoController.getProyectos);
router.get("/proyectos/nombre", /* #swagger.tags = ['Proyecto'] */ ProyectoController.getProyectosByNombre);
router.get("/proyectos/distrito", /* #swagger.tags = ['Proyecto'] */ ProyectoController.getProyectosByDistrito);
router.get("/proyectos/:id", /* #swagger.tags = ['Proyecto'] */ ProyectoController.getProyectoById);
router.post("/proyectos", /* #swagger.tags = ['Proyecto'] */ ProyectoController.createProyecto);
router.put("/proyectos/:id", /* #swagger.tags = ['Proyecto'] */ ProyectoController.updateProyecto);
router.delete("/proyectos/:id", /* #swagger.tags = ['Proyecto'] */ ProyectoController.deleteProyecto);

module.exports = router;
