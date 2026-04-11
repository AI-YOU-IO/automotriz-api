/**
 * Servidor WebSocket para GQM CRM
 *
 * Conecta el frontend (Next.js) con el backend para mensajes en tiempo real.
 * Los mensajes entrantes llegan via webhook HTTP desde n8n/messageProcessing.
 * Los mensajes salientes se envian via WhatsApp Graph API y se guardan en BD.
 *
 * Ejecutar: node websocket/websocketServer.js
 */
process.env.TZ = 'America/Lima';

const WebSocket = require('ws');
const http = require('http');

// ============================================
// CONFIGURACION
// ============================================
const CONFIG = {
    PORT: process.env.WS_PORT || 8080,
    API_URL: process.env.API_URL || 'http://localhost:3020'
};

// ============================================
// SERVIDOR HTTP + WEBSOCKET
// ============================================
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Almacenar clientes conectados
const clients = new Map(); // clientId -> { ws, contactos: Set, ip }
const contactoClients = new Map(); // contactoId (string) -> Set<clientId>

/**
 * Notificar a clientes suscritos a un contacto
 */
function notifyContactSubscribers(contactoId, data) {
    const contactoIdStr = String(contactoId);

    console.log(`[notify] Contacto: ${contactoIdStr}`);
    console.log(`  Suscripciones activas:`, Array.from(contactoClients.keys()));

    const subscribers = contactoClients.get(contactoIdStr);

    if (subscribers && subscribers.size > 0) {
        console.log(`  ${subscribers.size} suscriptor(es) encontrados`);
        subscribers.forEach(clientId => {
            const client = clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(data));
                console.log(`  Enviado a ${clientId}`);
            }
        });
    } else {
        console.log(`  Sin suscriptores para contacto ${contactoIdStr}`);
    }
}

/**
 * Broadcast a todos los clientes conectados (para actualizar lista de contactos)
 */
function broadcastToAll(data) {
    clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    });
}

// ============================================
// MANEJO DE CONEXIONES WEBSOCKET
// ============================================

wss.on('connection', (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    clients.set(clientId, { ws, contactos: new Set(), ip: clientIp });

    console.log(`[+] Cliente conectado: ${clientId} desde ${clientIp} (total: ${clients.size})`);

    // Enviar confirmacion
    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId,
        message: 'Conexion establecida con el servidor WebSocket GQM'
    }));

    // Manejar mensajes
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`[msg] ${clientId}: ${data.action}`);

            switch (data.action) {
                case 'subscribe':
                    handleSubscribe(clientId, data.id_contacto);
                    break;

                case 'unsubscribe':
                    handleUnsubscribe(clientId, data.id_contacto);
                    break;

                case 'enviar_mensaje':
                    await handleEnviarMensaje(ws, data, clientId);
                    break;

                case 'ping':
                case 'verificar_conexion':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                default:
                    console.log(`[warn] Accion desconocida: ${data.action}`);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Accion desconocida: ${data.action}`
                    }));
            }
        } catch (error) {
            console.error(`[error] Procesando mensaje de ${clientId}:`, error.message);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error al procesar el mensaje',
                error: error.message
            }));
        }
    });

    // Manejar desconexion
    ws.on('close', (code, reason) => {
        handleDisconnect(clientId, code, reason);
    });

    ws.on('error', (error) => {
        console.error(`[error] Cliente ${clientId}:`, error.message);
        handleDisconnect(clientId);
    });
});

/**
 * Suscribir cliente a un contacto
 */
function handleSubscribe(clientId, contactoId) {
    const client = clients.get(clientId);
    if (!client || !contactoId) return;

    const contactoIdStr = String(contactoId);

    client.contactos.add(contactoIdStr);

    if (!contactoClients.has(contactoIdStr)) {
        contactoClients.set(contactoIdStr, new Set());
    }
    contactoClients.get(contactoIdStr).add(clientId);

    console.log(`[subscribe] ${clientId} -> contacto ${contactoIdStr}`);

    client.ws.send(JSON.stringify({
        type: 'subscribed',
        id_contacto: contactoIdStr
    }));
}

/**
 * Desuscribir cliente de un contacto
 */
function handleUnsubscribe(clientId, contactoId) {
    const client = clients.get(clientId);
    if (!client) return;

    const contactoIdStr = String(contactoId);

    client.contactos.delete(contactoIdStr);

    const subscribers = contactoClients.get(contactoIdStr);
    if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
            contactoClients.delete(contactoIdStr);
        }
    }

    console.log(`[unsubscribe] ${clientId} -> contacto ${contactoIdStr}`);
}

/**
 * Enviar mensaje a WhatsApp via viva-api HTTP (fallback)
 * El frontend normalmente envia via HTTP directo, pero si usa WS:
 */
async function handleEnviarMensaje(ws, data, clientId) {
    const { id_contacto, contenido, id_empresa, telefono } = data;

    console.log(`[enviar] Contacto: ${id_contacto}, Contenido: ${contenido?.substring(0, 50)}`);

    try {
        // Llamar al endpoint HTTP de viva-api para enviar el mensaje
        const response = await fetch(`${CONFIG.API_URL}/api/crm/contacto/${id_contacto}/mensajes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contenido })
        });

        const resultado = await response.json();

        if (response.ok) {
            const contactoIdStr = String(id_contacto);

            // Confirmar al remitente
            ws.send(JSON.stringify({
                type: 'mensaje_enviado',
                success: true,
                id_contacto: contactoIdStr,
                contenido,
                timestamp: new Date().toISOString(),
                messageId: resultado.data?.id || `msg_${Date.now()}`
            }));

            // Notificar a otros suscriptores del mismo contacto
            notifyContactSubscribers(contactoIdStr, {
                type: 'nuevo_mensaje',
                data: {
                    id: resultado.data?.id || Date.now(),
                    id_contacto: contactoIdStr,
                    contenido,
                    direccion: 'out',
                    tipo: 'text',
                    fecha_hora: new Date().toISOString()
                }
            });

            console.log(`[enviar] OK contacto ${contactoIdStr}`);
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                action: 'enviar_mensaje',
                message: resultado.msg || resultado.error || 'Error al enviar mensaje',
                id_contacto
            }));
            console.log(`[enviar] Error:`, resultado);
        }
    } catch (error) {
        console.error(`[enviar] Error:`, error.message);
        ws.send(JSON.stringify({
            type: 'error',
            action: 'enviar_mensaje',
            message: 'Error interno del servidor',
            error: error.message
        }));
    }
}

/**
 * Manejar desconexion de cliente
 */
function handleDisconnect(clientId, code, reason) {
    const client = clients.get(clientId);
    if (!client) return;

    // Limpiar suscripciones
    client.contactos.forEach(contactoIdStr => {
        const subscribers = contactoClients.get(contactoIdStr);
        if (subscribers) {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
                contactoClients.delete(contactoIdStr);
            }
        }
    });

    clients.delete(clientId);
    console.log(`[-] Cliente desconectado: ${clientId} (total: ${clients.size})`);
}

// ============================================
// ENDPOINTS HTTP (Webhooks)
// ============================================

server.on('request', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // -----------------------------------------------
    // POST /webhook/mensaje-entrante
    // Llamar desde n8n, messageProcessing o cualquier
    // servicio que registre mensajes entrantes en BD
    // -----------------------------------------------
    if (req.method === 'POST' && req.url === '/webhook/mensaje-entrante') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(`[webhook] mensaje-entrante: contacto=${data.id_contacto}`);

                const contactoIdStr = String(data.id_contacto);

                // Notificar a suscriptores del contacto especifico
                notifyContactSubscribers(contactoIdStr, {
                    type: 'nuevo_mensaje',
                    data: data.mensaje
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, notified: contactoIdStr }));
            } catch (error) {
                console.error(`[webhook] Error:`, error.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // -----------------------------------------------
    // POST /webhook/mensaje-saliente
    // Notificar cuando se envia un mensaje saliente
    // (desde otro asesor, bot, etc.)
    // -----------------------------------------------
    if (req.method === 'POST' && req.url === '/webhook/mensaje-saliente') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log(`[webhook] mensaje-saliente: contacto=${data.id_contacto}`);

                const contactoIdStr = String(data.id_contacto);

                notifyContactSubscribers(contactoIdStr, {
                    type: 'nuevo_mensaje',
                    data: data.mensaje
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, notified: contactoIdStr }));
            } catch (error) {
                console.error(`[webhook] Error:`, error.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // -----------------------------------------------
    // GET /health
    // -----------------------------------------------
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'gqm-websocket',
            clients: clients.size,
            subscriptions: contactoClients.size,
            uptime: process.uptime()
        }));
        return;
    }

    // -----------------------------------------------
    // GET /stats
    // -----------------------------------------------
    if (req.method === 'GET' && req.url === '/stats') {
        const stats = {
            clients: clients.size,
            subscriptions: {},
            uptime: process.uptime()
        };
        contactoClients.forEach((subs, contactoId) => {
            stats.subscriptions[contactoId] = subs.size;
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(CONFIG.PORT, () => {
    console.log('==========================================================');
    console.log('  GQM WebSocket Server');
    console.log(`  WebSocket: ws://localhost:${CONFIG.PORT}`);
    console.log(`  Health:    GET http://localhost:${CONFIG.PORT}/health`);
    console.log(`  Stats:     GET http://localhost:${CONFIG.PORT}/stats`);
    console.log(`  Webhook:   POST http://localhost:${CONFIG.PORT}/webhook/mensaje-entrante`);
    console.log(`  Webhook:   POST http://localhost:${CONFIG.PORT}/webhook/mensaje-saliente`);
    console.log(`  API URL:   ${CONFIG.API_URL}`);
    console.log('==========================================================');
});

// Cierre graceful
process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    wss.close(() => {
        server.close(() => {
            console.log('Servidor cerrado');
            process.exit(0);
        });
    });
});

// Exportar para uso externo (notificar desde otros modulos)
module.exports = { notifyContactSubscribers, broadcastToAll };
