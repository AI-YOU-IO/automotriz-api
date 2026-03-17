const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// Aumentar límite para recibir archivos en base64
app.use(express.json({ limit: '50mb' }));

// Configuración
const CONFIG = {
    PORT: process.env.WEBHOOK_PORT || 3030,
    // URL del webhook de n8n para procesar mensajes
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'https://bitel-n8n-bitel.xylure.easypanel.host/webhook/5263fbce-4ecc-4ef6-b18e-564ff29b255c/chat',
    // Token de autenticación
    AUTH_TOKEN: process.env.AUTH_TOKEN || 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961'
};

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Mapeo de tipos de archivo para directorios
 */
const TYPE_MAPPING = {
    'image': 'imagen',
    'video': 'video',
    'audio': 'audio',
    'voice': 'audio',
    'document': 'documentos',
    'sticker': 'imagen'
};

/**
 * Extensiones por defecto según tipo
 */
const DEFAULT_EXTENSIONS = {
    'image': 'jpg',
    'video': 'mp4',
    'audio': 'opus',
    'voice': 'opus',
    'document': 'pdf',
    'sticker': 'webp'
};

/**
 * Sanitizar nombre de archivo
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Procesar buffer base64
 */
function processBuffer(buffer) {
    if (!buffer) return null;

    // Limpiar buffer (remover prefijo data: si existe)
    let cleanBuffer = buffer.replace(/^data:.*?;base64,/, '');
    cleanBuffer = cleanBuffer.replace(/\s+/g, '');

    // Verificar si es base64 válido
    if (/^[A-Za-z0-9+/=]+$/.test(cleanBuffer)) {
        try {
            const decoded = Buffer.from(cleanBuffer, 'base64');
            if (decoded.length > 0) {
                return {
                    content: decoded,
                    isBase64: true,
                    size: decoded.length
                };
            }
        } catch (e) {
            // No es base64 válido
        }
    }

    // Si no es base64, usar directo
    return {
        content: Buffer.from(buffer),
        isBase64: false,
        size: buffer.length
    };
}

/**
 * Procesar archivos del buffer
 */
function processBufferFiles(bufferData, sessionId, fromNumber) {
    const uploadedFiles = [];

    if (!bufferData || !Array.isArray(bufferData) || bufferData.length === 0) {
        return uploadedFiles;
    }

    bufferData.forEach((bufferItem, index) => {
        try {
            const type = bufferItem.type || 'document';
            const buffer = bufferItem.data || bufferItem.buffer || null;
            let filename = bufferItem.filename || null;
            const mimetype = bufferItem.mimetype || 'application/octet-stream';
            const caption = bufferItem.caption || null;
            const itemMessageId = bufferItem.messageId || null;

            if (!buffer) {
                console.log(`⚠️  Buffer item #${index} no tiene 'data' ni 'buffer', saltando...`);
                console.log(`    Campos disponibles: ${Object.keys(bufferItem).join(', ')}`);
                return;
            }

            console.log(`📎 Procesando archivo #${index}: tipo=${type}, filename=${filename}`);
            console.log(`   📏 Tamaño buffer recibido: ${buffer.length} caracteres (antes de decodificar)`);

            // Generar filename si no viene
            if (!filename) {
                const timestamp = Date.now();
                const ext = DEFAULT_EXTENSIONS[type] || 'bin';
                filename = `${type}_${timestamp}.${ext}`;
            }

            // Sanitizar filename
            filename = sanitizeFilename(filename);

            // Procesar buffer
            const processed = processBuffer(buffer);
            if (!processed || processed.size === 0) {
                console.log(`❌ Buffer vacío después de procesar`);
                return;
            }

            console.log(`   ✅ Buffer ${processed.isBase64 ? 'decodificado desde base64' : 'usado directamente'}: ${processed.size} bytes`);

            // Calcular hash MD5 del archivo
            const fileHash = crypto.createHash('md5').update(processed.content).digest('hex');

            // Construir path virtual (sin subir a S3 por ahora)
            const uploadType = TYPE_MAPPING[type] || 'documentos';
            const filePath = `uploads/bitel/${sessionId}/${uploadType}/${filename}`;

            // Agregar a array de archivos procesados
            uploadedFiles.push({
                index,
                type,
                messageId: itemMessageId,
                filename,
                originalFilename: bufferItem.filename || filename,
                path: filePath,
                size: processed.size,
                caption,
                mimetype,
                hash: fileHash,
                // Incluir buffer base64 para que n8n pueda procesarlo
                bufferBase64: processed.content.toString('base64')
            });

            console.log(`✅ Archivo #${index} procesado exitosamente`);

        } catch (e) {
            console.error(`❌ Error al procesar archivo #${index}:`, e.message);
        }
    });

    return uploadedFiles;
}

/**
 * Procesar mensaje de WhatsApp recibido
 */
async function recibirMensajeWhatsApp(data, res) {
    try {
        // El campo "data" puede venir como string JSON o como objeto
        let messageData = data.data;
        if (typeof messageData === 'string') {
            try {
                messageData = JSON.parse(messageData);
            } catch (e) {
                throw new Error("No se pudo decodificar los datos del mensaje");
            }
        }

        if (!messageData) {
            messageData = data; // Usar data directamente si no hay campo data
        }

        console.log('========== MENSAJE WHATSAPP RECIBIDO ==========');
        console.log('Data recibida:', JSON.stringify(messageData, null, 2));

        // Extraer datos del mensaje
        const sessionId = messageData.sessionId || messageData.EmpresaId || null;
        const fromNumber = messageData.fromNumber || messageData.from?.replace('@s.whatsapp.net', '') || null;
        const messageText = messageData.messageText || messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '';
        const messageTypes = messageData.messageTypes || ['text'];
        const messageCount = messageData.messageCount || 1;
        const bufferData = messageData.buffer || [];

        // Extraer datos legacy para retrocompatibilidad
        const messageId = messageData.messageId || null;
        const from = messageData.from || null;
        const timestamp = messageData.timestamp || Date.now();
        const pushName = messageData.pushName || 'Usuario';
        const messageType = messageData.messageType || 'text';

        console.log(`Session ID: ${sessionId}`);
        console.log(`From Number: ${fromNumber}`);
        console.log(`Message Types: ${messageTypes.join(', ')}`);
        console.log(`Message Count: ${messageCount}`);
        console.log(`Buffer Items: ${bufferData.length}`);

        // Procesar archivos del buffer si existen
        const uploadedFiles = processBufferFiles(bufferData, sessionId, fromNumber);

        // Preparar payload para n8n
        const payload = {
            EmpresaId: sessionId,
            messageId,
            from,
            fromNumber,
            timestamp,
            messageText,
            pushName,
            messageType,
            messageTypes,
            messageCount,
            buffer: bufferData,  // Buffer original completo
            files: uploadedFiles  // Archivos procesados con info
        };

        // Enviar a n8n
        console.log(`📡 Enviando a n8n: ${CONFIG.N8N_WEBHOOK_URL}`);

        const response = await axios.post(CONFIG.N8N_WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000,
            maxRedirects: 5
        });

        const httpCode = response.status;
        console.log(`✅ Mensaje enviado a n8n - HTTP ${httpCode}`);
        console.log(`Archivos procesados: ${uploadedFiles.length}`);
        console.log('=============================================');

        // Responder con éxito
        res.json({
            success: true,
            message: 'Mensaje recibido y enviado a n8n',
            data: {
                session_id: sessionId,
                from: fromNumber,
                mensaje: messageText,
                pushName,
                n8n_status: httpCode,
                message_types: messageTypes,
                message_count: messageCount,
                files_uploaded: uploadedFiles.length,
                files: uploadedFiles.map(f => ({
                    index: f.index,
                    type: f.type,
                    filename: f.filename,
                    size: f.size,
                    mimetype: f.mimetype
                }))
            }
        });

    } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || null
        });
    }
}

/**
 * Webhook principal con codOpe (compatible con estructura PHP)
 * POST /webhook/trigger
 */
app.post('/webhook/trigger', async (req, res) => {
    try {
        const { codOpe } = req.body;

        if (!codOpe) {
            return res.status(400).json({
                error: 'Código de operación requerido'
            });
        }

        switch (codOpe) {
            case 'ENVIAR_MENSAJE_WHATSAPP':
                await recibirMensajeWhatsApp(req.body, res);
                break;

            default:
                return res.status(400).json({
                    error: 'Operación no válida'
                });
        }

    } catch (error) {
        console.error('❌ Error en trigger:', error.message);
        res.status(500).json({
            error: 'Error en el servidor',
            details: error.message
        });
    }
});

/**
 * Webhook para recibir mensajes de WhatsApp (Baileys) - directo
 * POST /webhook/whatsapp
 */
app.post('/webhook/whatsapp', async (req, res) => {
    try {
        // Simular estructura con codOpe para reutilizar lógica
        const data = {
            codOpe: 'ENVIAR_MENSAJE_WHATSAPP',
            data: req.body
        };
        await recibirMensajeWhatsApp(data, res);

    } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bitel WhatsApp Webhook - n8n Trigger',
        timestamp: new Date().toISOString(),
        n8n_webhook: CONFIG.N8N_WEBHOOK_URL
    });
});

// Iniciar servidor
app.listen(CONFIG.PORT, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 Webhook WhatsApp - n8n Trigger');
    console.log(`📡 Puerto: ${CONFIG.PORT}`);
    console.log(`🔗 n8n Webhook: ${CONFIG.N8N_WEBHOOK_URL}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Endpoints:');
    console.log(`  POST /webhook/trigger   - Con codOpe (compatible PHP)`);
    console.log(`  POST /webhook/whatsapp  - Directo desde Baileys`);
    console.log(`  GET  /health            - Health check`);
    console.log('');
    console.log('Formato esperado (codOpe):');
    console.log('  { codOpe: "ENVIAR_MENSAJE_WHATSAPP", data: {...} }');
    console.log('');
    console.log('Formato esperado (directo):');
    console.log('  { sessionId, fromNumber, messageText, buffer, ... }');
    console.log('═══════════════════════════════════════════════════════════');
});

module.exports = app;
