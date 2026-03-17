const logger = require('../../config/logger/loggerClient.js');

class SperantServices {
  async crearCitaSperant(data) {
    try {
      const response = await fetch("https://api.sperant.com/v3/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.SPERANT_KEY
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        logger.info(`[sperant.service.js] Creacion de cita existosa: ${JSON.stringify(result)}`);
      } else {
        logger.error(`[sperant.service.js] Error al crear cita (${response.status}): ${JSON.stringify(result)}`);
      }

      return { status: response.status, data: result };
    } catch (error) {
      logger.error(`[sperant.service.js] Error al crear cita: ${error}`);

      return null;
    }
  }

  async obtenerPuntaje(id) {
    try {
      const response = await fetch(`https://api.sperant.com/v3/clients/${id}`, {
        method: "GET",
        headers: {
          "Authorization": process.env.SPERANT_KEY
        }
      });

      const result = await response.json();

      if (response.ok) {
        logger.info(`[sperant.service.js] Obtencion del cliente exitoso: ${JSON.stringify(result)}`);
      } else {
        logger.error(`[sperant.service.js] Error al obtener cliente (${response.status}): ${JSON.stringify(result)}`);
      }

      return { status: response.status, data: result };
    } catch (error) {
      logger.error(`[sperant.service.js] Error al obtener cliente: ${error}`);

      return null;
    }
  }

  async crearInteraccionSperant(id, data) {
    try {
      const response = await fetch(`https://api.sperant.com/v3/clients/${id}/interactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.SPERANT_KEY
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        logger.info(`[sperant.service.js] Creacion de interaccion existosa: ${JSON.stringify(result)}`);
      } else {
        logger.error(`[sperant.service.js] Error al crear interaccion (${response.status}): ${JSON.stringify(result)}`);
      }

      return { status: response.status, data: result };
    } catch (error) {
      logger.error(`[sperant.service.js] Error al crear interaccion: ${error}`);

      return null;
    }
  }

  async crearClienteSperant(data) {
    try {
      const response = await fetch("https://api.sperant.com/v3/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": process.env.SPERANT_KEY
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        logger.info(`[sperant.service.js] Creacion de cliente existosa: ${JSON.stringify(result)}`);
      } else {
        logger.error(`[sperant.service.js] Problemas al crear cliente (${response.status}): ${JSON.stringify(result)}`);
      }

      return { status: response.status, data: result };
    } catch (error) {
      logger.error(`[sperant.service.js] Error al crear cliente: ${error}`);
      
      return null;
    }
  }
}

module.exports = new SperantServices();