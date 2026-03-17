const express = require('express');
const router = express.Router();
const axios = require('axios');
// const db = require('../src/models/sequelize'); // Comentado temporalmente

// URL del webhook de n8n para eventos de Sperant
const N8N_SPERANT_URL = 'https://maravia-n8n-maravia-externo.dvmssk.easypanel.host/webhook/sperant_eventos';

/**
 * Convierte timestamp Unix (segundos) a Date
 */
// function timestampToDate(timestamp) {
//   if (!timestamp) return null;
//   return new Date(timestamp * 1000);
// }

/**
 * POST /webhook/event
 * Recibe JSON y lo envía a n8n
 */
router.post('/event', async (req, res) => {
  try {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El cuerpo del request no puede estar vacío'
      });
    }

    const eventName = body.event_name;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'El campo event_name es requerido'
      });
    }

    // Enviar evento a n8n
    console.log(`[webhook/event] Enviando evento "${eventName}" a n8n...`);
    console.log(`[webhook/event] URL: ${N8N_SPERANT_URL}`);
    console.log(`[webhook/event] Body:`, JSON.stringify(body, null, 2));

    const n8nResponse = await axios.post(N8N_SPERANT_URL, body, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log(`[webhook/event] Evento enviado a n8n - Status: ${n8nResponse.status}`);

    return res.status(200).json({
      success: true,
      message: 'Evento enviado a n8n exitosamente',
      data: {
        event_name: eventName,
        n8n_status: n8nResponse.status
      }
    });

    /* CÓDIGO COMENTADO - Lógica de registro en base de datos
    const eventNameLower = eventName.toLowerCase();

    // Si event_name contiene "client" -> INSERT en prospecto
    if (eventNameLower.includes('client')) {
      const client = body.client;

      if (!client) {
        return res.status(400).json({
          success: false,
          error: 'El campo "client" es requerido para eventos de tipo client'
        });
      }

      // Mapear campos del JSON a la tabla prospecto
      const nombreCompleto = [client.fname, client.lname].filter(Boolean).join(' ').trim() || 'Sin nombre';
      const interestType = client.interest_type_name || client.last_interaction_project?.interest_type_name;

      const usuarioId = 1;

      const nuevoProspecto = await db.Prospecto.create({
        nombre_completo: nombreCompleto,
        dni: client.document || null,
        celular: client.phone || null,
        email: client.email || null,
        id_usuario: usuarioId,
        id_estado_prospecto: 1, // Estado por defecto
        id_empresa: 1, // Empresa por defecto
        sperant_uuid: client.id ? String(client.id) : null,
        calificacion_lead: interestType || 'frio',
        fue_contactado: 0,
        usuario_registro: usuarioId,
        usuario_actualizacion: usuarioId
      });

      console.log(`[webhook/event] Prospecto creado con ID: ${nuevoProspecto.id}`);

      return res.status(201).json({
        success: true,
        message: 'Prospecto creado exitosamente',
        data: {
          tabla: 'prospecto',
          id: nuevoProspecto.id,
          event_name: eventName,
          sperant_uuid: client.id
        }
      });
    }

    // Si event_name contiene "event" -> INSERT en cita
    if (eventNameLower.includes('event')) {
      const event = body.event;

      if (!event) {
        return res.status(400).json({
          success: false,
          error: 'El campo "event" es requerido para eventos de tipo event'
        });
      }

      // Convertir timestamps a fechas
      const horaInicio = timestampToDate(event.datetime_start);
      const horaFin = timestampToDate(event.datetime_end);

      if (!horaInicio || !horaFin) {
        return res.status(400).json({
          success: false,
          error: 'Los campos datetime_start y datetime_end son requeridos'
        });
      }

      const usuarioIdCita = 1; // Usuario por defecto temporalmente

      const nuevaCita = await db.Cita.create({
        nombre: event.name || 'Sin nombre',
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        lugar: event.place || null,
        descripcion: event.description || null,
        id_prospecto: null,
        id_proyecto: null,
        id_unidad: null,
        id_estado_cita: 1, // Estado por defecto
        id_usuario: usuarioIdCita,
        usuario_registro: usuarioIdCita,
        usuario_actualizacion: usuarioIdCita
      });

      console.log(`[webhook/event] Cita creada con ID: ${nuevaCita.id}`);

      return res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: {
          tabla: 'cita',
          id: nuevaCita.id,
          event_name: eventName,
          sperant_id: event.id
        }
      });
    }

    // Si event_name no contiene ni "client" ni "event"
    return res.status(400).json({
      success: false,
      error: 'El event_name debe contener "client" o "event"'
    });
    FIN CÓDIGO COMENTADO */

  } catch (error) {
    console.error('[webhook/event] Error:', error.message);

    // Si es error de axios, mostrar detalles de la respuesta de n8n
    if (error.response) {
      console.error('[webhook/event] n8n Response Status:', error.response.status);
      console.error('[webhook/event] n8n Response Data:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: 'Error al enviar a n8n',
        n8n_status: error.response.status,
        n8n_response: error.response.data,
        details: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
