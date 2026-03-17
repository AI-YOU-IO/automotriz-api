// assistant
const AssistantService = require("../services/assistant/asistant.service");
// modelo de contacto
const TblContactoModel = require("../models/tblContacto.model.js");
const TblClienteRestModel = require("../models/tblClienteRest.model.js");
const logger = require('../config/logger/loggerClient');
const { getLocalDateTime } = require('../utils/customTimestamp');

class MessageProcessingController {

    async processMessage(req, res) {
        try {
            let { phone, question } = req.body;
            phone = phone.trim();
            question = question.trim();

            let userType = req.userType;
            userType = userType.trim();

            // Fecha de consumo
            let fechaConsumo = getLocalDateTime();
            fechaConsumo = fechaConsumo.split(" ")[0];

            // Verificar si existe el cliente rest para la fecha de consumo
            const clienteRestModel = new TblClienteRestModel();
            const clienteRest = await clienteRestModel.selectByFechaAndTipo(fechaConsumo, userType);
            
            let id_cliente_rest;
            if (!clienteRest) {
                // Registrar cliente rest e inicializar el contador de consumo
                id_cliente_rest = await clienteRestModel.createUserConsumo(fechaConsumo, userType);
            } else {
                id_cliente_rest = clienteRest.id;
            }

            // Obtener el consumo total de un usuario
            const consumoTotal = await clienteRestModel.getConsumoTotal(userType);

            // Si el consumo total es mayor o igual a 20k, se cierra el chat
            if (consumoTotal >= 20000) {
                return res.clientError(403, "El usuario ha alcanzado el límite de consumo");
            }

            // Verificar si existe el contacto
            const contactModel = new TblContactoModel();
            const contact = await contactModel.getByCelular(phone, id_cliente_rest);

            let contactId;
            let contactCount;

            if (!contact) {
                // Registrar contacto
                contactId = await contactModel.create(phone, id_cliente_rest);
                contactCount = 0;
            } else {
                contactId = contact.id;
                contactCount = contact.count;
            }


            // Incrementar consumo cuando el contador de contacto es 0
            if (contactCount === 0) {
                await clienteRestModel.updateConsumo(fechaConsumo, userType);
            }

            // Incrementar el contador incremental incr_count de un contacto por su id
            await contactModel.incrementIncrCountById(contactId);

            // Asistente
            const response = await AssistantService.runProcess({
                contactId: contactId,
                message: question,
                nombre_modelo: "gpt-4.1-mini"
            });

            // Respuesta
            let status;
            let answer;

            // Verificar el valor del contador de contacto
            const maxCountContact = parseInt(process.env.MAX_COUNT_VALUE);
            
            if (contactCount >= maxCountContact && response.estado_respuesta !== "finalizada") {
                status = "queue";
                answer = "Gracias por tu mensaje 😊\nEn este momento te estamos derivando con un asesor experto en este tema, quien podrá ayudarte de manera más detallada.\n\n⏳ Solo tomará unos instantes. ¡Gracias por tu paciencia!";
                // Resetear el contador de contacto
                await contactModel.resetCountByCelular(phone, id_cliente_rest);

                // registrar consumo
                //await clienteRestModel.updateConsumo(fechaConsumo, userType);
            } else {

                // Incrementar el contador de contacto en 1
                await contactModel.incrementCountByCelular(phone, id_cliente_rest);

                if (response.estado_respuesta === "exitosa") {
                    status = "pending";
                    answer = response.mensaje_asistente;

                } else if (response.estado_respuesta === "derivada") {
                    status = "queue";
                    answer = response.mensaje_asistente;
                    // Resetear el contador de contacto
                    await contactModel.resetCountByCelular(phone, id_cliente_rest);
                    // registrar consumo
                    //await clienteRestModel.updateConsumo(fechaConsumo, userType);

                } else if (response.estado_respuesta === "ambigua") {
                    status = "pending";
                    answer = response.mensaje_asistente;

                } else if (response.estado_respuesta === "finalizada") {
                    status = "closed";
                    answer = response.mensaje_asistente;
                    // Resetear el contador de contacto
                    await contactModel.resetCountByCelular(phone, id_cliente_rest);
                    // registrar consumo
                    //await clienteRestModel.updateConsumo(fechaConsumo, userType);
                }

            }

            return res.success(200, "Mensaje procesado correctamente", { status, answer });

        } catch (error) {
            logger.error(`[messageProcessing.controller.js] Error al procesar el mensaje: ${error.message}`);
            return res.serverError(500, "Error Interno en el servidor");
        }
    }
}

module.exports = new MessageProcessingController();