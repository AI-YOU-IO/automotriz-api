const { query, body } = require("express-validator");

const processMessageValidator = [
    body("phone")
        .notEmpty().withMessage("El campo phone es requerido")
        .isString().withMessage("El campo phone debe ser una cadena de texto")
        .matches(/^[0-9]+$/).withMessage("El campo phone debe contener solo números"),
        
    body("question")
        .notEmpty().withMessage("El campo question es requerido")
        .isString().withMessage("El campo question debe ser una cadena de texto"),

];



module.exports = {
    processMessageValidator
};