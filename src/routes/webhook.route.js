// const express = require('express');
// const axios = require('axios');
// const sharp = require('sharp');
// const path = require('path');
// const crypto = require('crypto');
// const https = require('https');
// const { isBotActivo } = require('../services/assistant/ws_contacto.js');
// const { pool } = require('../config/dbConnection.js');
// const { getMensajesEnVisto } = require('../services/mensajes/ws_mensajes_visto.js');
// const {
//     getArgumentosVenta,
//     getArgumentoVentaById,
//     createArgumentoVenta,
//     updateArgumentoVenta,
//     deleteArgumentoVenta,
//     getPeriodicidadRecordatorio,
//     getPeriodicidadRecordatorioById,
//     createPeriodicidadRecordatorio,
//     updatePeriodicidadRecordatorio,
//     deletePeriodicidadRecordatorio
// } = require('../services/mensajes/ws_argumentos_ventas.js');
// const {
//     getContactoRecordatorios,
//     getRecordatorioByContactoId,
//     incrementarRecordatorio,
//     resetearRecordatorio,
//     actualizarLimiteRecordatorio,
//     deleteRecordatorio
// } = require('../services/mensajes/ws_recordatorios.js');
// const { openAIResponse } = require('../services/openAI/openai.service.js');

// // Agente HTTPS que ignora verificación SSL (como PHP cURL)
// const httpsAgent = new https.Agent({
//     rejectUnauthorized: false
// });

// const router = express.Router();

// // Configuración
// const CONFIG = {
//     BAILEYS_URL: process.env.BAILEYS_URL || 'https://bitel-baileys.xylure.easypanel.host',
//     AUTH_TOKEN: process.env.BAILEYS_AUTH_TOKEN || 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961',
//     BITEL_API_KEY: process.env.USER_API_KEY || '4798d8360969047c6072cb160fad77829288f528f6aa41d35c48134d0a30772a',
//     SESSION_ID: process.env.SESSION_ID || 'bitel',
//     N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'https://bitel-n8n-bitel.xylure.easypanel.host/webhook/5263fbce-4ecc-4ef6-b18e-564ff29b255c/chat',
//     SERVER_BASE_URL: process.env.SERVER_BASE_URL || 'https://portabilidad-bitel.ai-you.io',
//     WS_SERVER_URL: process.env.WS_SERVER_URL || 'https://bitel-websocket.xylure.easypanel.host'
// };

// /**
//  * Obtiene el ID del contacto por número de celular
//  */
// async function getContactoIdByCelular(celular) {
//     try {
//         const [rows] = await pool.execute(
//             'SELECT id FROM contacto WHERE celular = ?',
//             [celular]
//         );
//         return rows.length > 0 ? rows[0].id : null;
//     } catch (error) {
//         console.error(`[webhook] Error al obtener contacto: ${error.message}`);
//         return null;
//     }
// }

// /**
//  * Notifica al WebSocket server sobre un nuevo mensaje
//  */
// async function notifyWebSocket(idContacto, mensaje) {
//     if (!idContacto) return;

//     try {
//         await axios.post(`${CONFIG.WS_SERVER_URL}/webhook/mensaje-entrante`, {
//             id_contacto: idContacto,
//             mensaje: mensaje
//         }, { timeout: 5000 });
//         console.log(`📡 WebSocket notificado para contacto ${idContacto}`);
//     } catch (error) {
//         console.warn(`⚠️ No se pudo notificar al WebSocket: ${error.message}`);
//     }
// }

// /**
//  * Convierte URL relativa a absoluta
//  */
// const getAbsoluteUrl = (url) => {
//     if (!url) return null;
//     if (url.startsWith('http://') || url.startsWith('https://')) return url;
//     return `${CONFIG.SERVER_BASE_URL}${url}`;
// };

// /**
//  * Mapeo de tipos de archivo para directorios
//  */
// const TYPE_MAPPING = {
//     'image': 'imagen',
//     'video': 'video',
//     'audio': 'audio',
//     'voice': 'audio',
//     'document': 'documentos',
//     'sticker': 'imagen'
// };

// /**
//  * Extensiones por defecto según tipo
//  */
// const DEFAULT_EXTENSIONS = {
//     'image': 'jpg',
//     'video': 'mp4',
//     'audio': 'opus',
//     'voice': 'opus',
//     'document': 'pdf',
//     'sticker': 'webp'
// };

// /**
//  * Sanitizar nombre de archivo
//  */
// function sanitizeFilename(filename) {
//     return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
// }

// /**
//  * Procesar buffer base64
//  */
// function processBuffer(buffer) {
//     if (!buffer) return null;

//     let cleanBuffer = buffer.replace(/^data:.*?;base64,/, '');
//     cleanBuffer = cleanBuffer.replace(/\s+/g, '');

//     if (/^[A-Za-z0-9+/=]+$/.test(cleanBuffer)) {
//         try {
//             const decoded = Buffer.from(cleanBuffer, 'base64');
//             if (decoded.length > 0) {
//                 return {
//                     content: decoded,
//                     isBase64: true,
//                     size: decoded.length
//                 };
//             }
//         } catch (e) {
//             // No es base64 válido
//         }
//     }

//     return {
//         content: Buffer.from(buffer),
//         isBase64: false,
//         size: buffer.length
//     };
// }

// /**
//  * Procesar archivos del buffer
//  */
// function processBufferFiles(bufferData, sessionId, fromNumber) {
//     const uploadedFiles = [];

//     if (!bufferData || !Array.isArray(bufferData) || bufferData.length === 0) {
//         return uploadedFiles;
//     }

//     bufferData.forEach((bufferItem, index) => {
//         try {
//             const type = bufferItem.type || 'document';
//             const buffer = bufferItem.data || bufferItem.buffer || null;
//             let filename = bufferItem.filename || null;
//             const mimetype = bufferItem.mimetype || 'application/octet-stream';
//             const caption = bufferItem.caption || null;
//             const itemMessageId = bufferItem.messageId || null;

//             if (!buffer) {
//                 console.log(`⚠️  Buffer item #${index} no tiene 'data' ni 'buffer', saltando...`);
//                 return;
//             }

//             console.log(`📎 Procesando archivo #${index}: tipo=${type}, filename=${filename}`);

//             if (!filename) {
//                 const timestamp = Date.now();
//                 const ext = DEFAULT_EXTENSIONS[type] || 'bin';
//                 filename = `${type}_${timestamp}.${ext}`;
//             }

//             filename = sanitizeFilename(filename);

//             const processed = processBuffer(buffer);
//             if (!processed || processed.size === 0) {
//                 console.log(`❌ Buffer vacío después de procesar`);
//                 return;
//             }

//             const fileHash = crypto.createHash('md5').update(processed.content).digest('hex');
//             const uploadType = TYPE_MAPPING[type] || 'documentos';
//             const filePath = `uploads/bitel/${sessionId}/${uploadType}/${filename}`;

//             uploadedFiles.push({
//                 index,
//                 type,
//                 messageId: itemMessageId,
//                 filename,
//                 originalFilename: bufferItem.filename || filename,
//                 path: filePath,
//                 size: processed.size,
//                 caption,
//                 mimetype,
//                 hash: fileHash,
//                 bufferBase64: processed.content.toString('base64')
//             });

//             console.log(`✅ Archivo #${index} procesado exitosamente`);

//         } catch (e) {
//             console.error(`❌ Error al procesar archivo #${index}:`, e.message);
//         }
//     });

//     return uploadedFiles;
// }

// /**
//  * Descargar archivo desde URL
//  */
// async function downloadFile(url, maxRetries = 2) {
//     let lastError = null;

//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//         if (attempt > 0) {
//             await new Promise(resolve => setTimeout(resolve, 2000));
//         }

//         try {
//             const response = await axios.get(url, {
//                 responseType: 'arraybuffer',
//                 timeout: 120000,
//                 maxRedirects: 10,
//                 httpsAgent,
//                 decompress: false,
//                 headers: {
//                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//                     'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
//                     'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
//                     'Accept-Encoding': 'identity',
//                     'Connection': 'keep-alive',
//                     'Cache-Control': 'no-cache'
//                 }
//             });

//             const firstBytes = Buffer.from(response.data).slice(0, 100).toString();
//             if (firstBytes.toLowerCase().includes('<html') || firstBytes.toLowerCase().includes('<!doctype')) {
//                 lastError = { error: 'Se recibió HTML en lugar del archivo', url };
//                 continue;
//             }

//             return {
//                 data: Buffer.from(response.data),
//                 contentType: response.headers['content-type'],
//                 size: response.data.byteLength
//             };

//         } catch (error) {
//             lastError = { error: error.message, url };
//         }
//     }
//     return lastError;
// }

// /**
//  * Comprimir imagen
//  */
// async function compressImage(imageBuffer, maxWidth = 800, quality = 70, maxSizeKB = 50) {
//     try {
//         let compressed = await sharp(imageBuffer)
//             .resize(maxWidth, null, { withoutEnlargement: true })
//             .jpeg({ quality })
//             .toBuffer();

//         let currentQuality = quality;
//         let currentWidth = maxWidth;

//         while (compressed.length / 1024 > maxSizeKB && currentQuality >= 20) {
//             currentQuality -= 10;
//             if (currentQuality < 50 && currentWidth > 400) {
//                 currentWidth = Math.floor(currentWidth * 0.75);
//             }
//             compressed = await sharp(imageBuffer)
//                 .resize(currentWidth, null, { withoutEnlargement: true })
//                 .jpeg({ quality: currentQuality })
//                 .toBuffer();
//         }

//         return {
//             data: compressed,
//             contentType: 'image/jpeg',
//             finalSize: compressed.length
//         };

//     } catch (error) {
//         return { data: imageBuffer, contentType: 'image/jpeg', error: error.message };
//     }
// }

// /**
//  * Enviar mensaje a Baileys
//  */
// async function sendToBaileys(id_empresa, phone, message, imageUrl = null) {
//     const baileysUrl = `${CONFIG.BAILEYS_URL}/session/${id_empresa}/send`;
//     const results = [];

//     if (imageUrl) {
//         const absoluteImageUrl = getAbsoluteUrl(imageUrl);
//         console.log(`🖼️ Descargando imagen: ${absoluteImageUrl}`);
//         const downloaded = await downloadFile(absoluteImageUrl);

//         if (!downloaded.error) {
//             const compressed = await compressImage(downloaded.data);

//             const imagePayload = {
//                 phone,
//                 media: compressed.data.toString('base64'),
//                 mimetype: compressed.contentType,
//                 message: message || ''
//             };

//             const imageResponse = await axios.post(baileysUrl, imagePayload, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
//                 },
//                 timeout: 30000
//             });

//             results.push({
//                 type: 'image',
//                 success: true,
//                 response: imageResponse.data,
//                 image_size_kb: (compressed.finalSize / 1024).toFixed(2)
//             });

//             return results;
//         }
//     }

//     if (message) {
//         const textPayload = { phone, message };

//         const textResponse = await axios.post(baileysUrl, textPayload, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
//             },
//             timeout: 30000
//         });

//         results.push({
//             type: 'text',
//             success: true,
//             response: textResponse.data
//         });
//     }

//     return results;
// }

// /**
//  * POST /webhook/send
//  * Recibe { phone, question }, procesa con Bitel API y envía por WhatsApp
//  */
// router.post('/send',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Enviar mensaje procesado por IA'
//     async (req, res) => {
//     try {
//         const { phone, question, wid } = req.body;

//         if (!phone) {
//             return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
//         }

//         if (!question) {
//             return res.status(400).json({ success: false, error: 'Pregunta requerida' });
//         }

//         if (!wid) {
//             return res.status(400).json({ success: false, error: 'WID Mensaje Requerido ' });         
//         }

//         console.log(`📥 [webhook/send] Recibida pregunta de ${phone}: ${question.substring(0, 50)}...`);

//         // Llamar al API de Bitel (mismo servidor)
//         const bitelResponse = await axios.post('https://portabilidad-bitel.ai-you.io/api/assistant/message', {
//             phone,
//             question,
//             wid
//         }, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${CONFIG.BITEL_API_KEY}`
//             },
//             timeout: 60000
//         });

//         console.log(`✅ [webhook/send] Respuesta de Bitel API:`, JSON.stringify(bitelResponse.data, null, 2));

//         const responseData = bitelResponse.data?.data || bitelResponse.data;
//         const dataObj = Array.isArray(responseData) ? responseData[0] : responseData;

//         const answer = dataObj?.answer || '';
//         const imagenUrl = dataObj?.imagen_url || null;
//         const status = dataObj?.status || 'pending';

//         if (!answer && !imagenUrl) {
//             return res.status(500).json({
//                 success: false,
//                 error: 'La API de Bitel no devolvió respuesta válida',
//                 bitel_response: bitelResponse.data
//             });
//         }

//         console.log(`📤 [webhook/send] Enviando respuesta a ${phone}`);

//         const results = await sendToBaileys(CONFIG.SESSION_ID, phone, answer, imagenUrl);

//         console.log(`✅ [webhook/send] Mensaje enviado correctamente a WhatsApp`);

//         res.json({
//             success: true,
//             message: 'Mensaje procesado y enviado correctamente',
//             data: { status, answer, imagen_url: imagenUrl },
//             whatsapp_results: results
//         });

//     } catch (error) {
//         console.error('❌ [webhook/send] Error:', error.message);
//         const statusCode = error.response?.status || 500;
//         res.status(statusCode).json({
//             success: false,
//             error: 'Error al procesar mensaje',
//             details: error.response?.data || error.message
//         });
//     }
// });

// /**
//  * POST /webhook/whatsapp
//  * Recibe mensajes de Baileys y los procesa
//  */
// router.post('/whatsapp',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Recibir mensajes de WhatsApp'
//     async (req, res) => {
//     try {
//         const data = req.body;

//         console.log('========== [webhook/whatsapp] MENSAJE RECIBIDO ==========');
//         console.log('Data:', JSON.stringify(data, null, 2));

//         const sessionId = data.sessionId || data.EmpresaId || null;
//         const fromNumber = data.fromNumber || data.from?.replace('@s.whatsapp.net', '') || null;
//         const messageText = data.messageText || data.message?.conversation || data.message?.extendedTextMessage?.text || '';
//         const pushName = data.pushName || 'Usuario';
//         const messageId = data.messageId || null;
//         const timestamp = data.timestamp || Date.now();

//         if (!fromNumber) {
//             return res.status(400).json({ success: false, error: 'Número de teléfono requerido (fromNumber)' });
//         }

//         if (!messageText || messageText.trim() === '') {
//             return res.status(400).json({ success: false, error: 'Mensaje de texto requerido (messageText)' });
//         }

//         console.log(`📱 From: ${fromNumber}`);
//         console.log(`💬 Message: ${messageText}`);

//         // Llamar al endpoint /webhook/send del mismo servidor
//         const response = await axios.post('https://portabilidad-bitel.ai-you.io/webhook/send', {
//             phone: fromNumber,
//             question: messageText
//         }, {
//             headers: { 'Content-Type': 'application/json' },
//             timeout: 120000
//         });

//         console.log('✅ [webhook/whatsapp] Respuesta:', JSON.stringify(response.data, null, 2));

//         const wsResponse = response.data;

//         res.json({
//             success: true,
//             data: {
//                 sessionId,
//                 fromNumber,
//                 messageId,
//                 timestamp,
//                 pushName,
//                 originalMessage: messageText,
//                 reply: wsResponse.data?.answer || 'Sin respuesta',
//                 status: wsResponse.data?.status || 'pending',
//                 imagen_url: wsResponse.data?.imagen_url || null,
//                 messageSent: true,
//                 whatsapp_results: wsResponse.whatsapp_results || []
//             }
//         });

//     } catch (error) {
//         console.error('❌ [webhook/whatsapp] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message,
//             details: error.response?.data || null
//         });
//     }
// });

// /**
//  * POST /webhook/send-whatsapp
//  * Endpoint para n8n - Envía mensaje directo a WhatsApp
//  *
//  * Tipos soportados: text, image, document, audio, video
//  *
//  * Payload según tipo:
//  *
//  * Texto:
//  * { "phone": "51999999999", "type": "text", "message": "Hola" }
//  *
//  * Imagen:
//  * { "phone": "51999999999", "type": "image", "image_url": "https://...", "message": "Caption opcional" }
//  *
//  * Documento:
//  * { "phone": "51999999999", "type": "document", "document_url": "https://...", "filename": "archivo.pdf", "message": "opcional" }
//  *
//  * Audio:
//  * { "phone": "51999999999", "type": "audio", "audio_url": "https://..." }
//  *
//  * Video:
//  * { "phone": "51999999999", "type": "video", "video_url": "https://...", "message": "Caption opcional" }
//  */
// router.post('/send-whatsapp',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Enviar mensaje directo a WhatsApp'
//     async (req, res) => {
//     try {
//         const {
//             phone,
//             message,
//             type = 'text',
//             image_url,
//             document_url,
//             filename,
//             audio_url,
//             video_url,
//             id_empresa
//         } = req.body;

//         if (!phone) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Número de teléfono requerido (phone)'
//             });
//         }

//         // Validaciones según tipo
//         switch (type) {
//             case 'text':
//                 if (!message) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'Mensaje requerido para tipo texto'
//                     });
//                 }
//                 break;
//             case 'image':
//                 if (!image_url) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'URL de imagen requerida (image_url)'
//                     });
//                 }
//                 break;
//             case 'document':
//                 if (!document_url) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'URL de documento requerida (document_url)'
//                     });
//                 }
//                 if (!filename) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'Nombre de archivo requerido (filename)'
//                     });
//                 }
//                 break;
//             case 'audio':
//                 if (!audio_url) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'URL de audio requerida (audio_url)'
//                     });
//                 }
//                 break;
//             case 'video':
//                 if (!video_url) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'URL de video requerida (video_url)'
//                     });
//                 }
//                 break;
//             default:
//                 return res.status(400).json({
//                     success: false,
//                     error: 'Tipo no válido. Use: text, image, document, audio, video'
//                 });
//         }

//         console.log('========== [webhook/send-whatsapp] ENVIANDO ==========');
//         console.log(`📱 Phone: ${phone}`);
//         console.log(`📝 Type: ${type}`);
//         console.log(`🏢 id_empresa/sessionId: ${id_empresa || CONFIG.SESSION_ID}`);
//         console.log(`💬 Message: ${message ? message.substring(0, 50) + '...' : 'Sin texto'}`);

//         const sessionId = id_empresa || CONFIG.SESSION_ID;
//         const baileysUrl = `${CONFIG.BAILEYS_URL}/session/${sessionId}/send`;
//         let payload = { phone };
//         let mediaUrl = null;

//         switch (type) {
//             case 'text':
//                 payload.message = message;
//                 break;

//             case 'image':
//                 mediaUrl = getAbsoluteUrl(image_url);
//                 console.log(`🖼️ Descargando imagen: ${mediaUrl}`);
//                 const imageDownload = await downloadFile(mediaUrl);
//                 if (imageDownload.error) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'No se pudo descargar la imagen',
//                         details: imageDownload
//                     });
//                 }
//                 const compressedImage = await compressImage(imageDownload.data);
//                 payload.media = compressedImage.data.toString('base64');
//                 payload.mimetype = compressedImage.contentType;
//                 payload.message = message || '';
//                 break;

//             case 'document':
//                 mediaUrl = getAbsoluteUrl(document_url);
//                 console.log(`📄 Descargando documento: ${mediaUrl}`);
//                 const docDownload = await downloadFile(mediaUrl);
//                 if (docDownload.error) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'No se pudo descargar el documento',
//                         details: docDownload
//                     });
//                 }
//                 payload.media = docDownload.data.toString('base64');
//                 payload.mimetype = docDownload.contentType || 'application/pdf';
//                 payload.mediaType = 'document';
//                 payload.filename = filename;
//                 payload.message = message || '';
//                 break;

//             case 'audio':
//                 mediaUrl = getAbsoluteUrl(audio_url);
//                 console.log(`🎵 Descargando audio: ${mediaUrl}`);
//                 const audioDownload = await downloadFile(mediaUrl);
//                 if (audioDownload.error) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'No se pudo descargar el audio',
//                         details: audioDownload
//                     });
//                 }
//                 payload.media = audioDownload.data.toString('base64');
//                 payload.mimetype = audioDownload.contentType || 'audio/mpeg';
//                 payload.message = '';
//                 break;

//             case 'video':
//                 mediaUrl = getAbsoluteUrl(video_url);
//                 console.log(`🎬 Descargando video: ${mediaUrl}`);
//                 const videoDownload = await downloadFile(mediaUrl);
//                 if (videoDownload.error) {
//                     return res.status(400).json({
//                         success: false,
//                         error: 'No se pudo descargar el video',
//                         details: videoDownload
//                     });
//                 }
//                 payload.media = videoDownload.data.toString('base64');
//                 payload.mimetype = videoDownload.contentType || 'video/mp4';
//                 payload.message = message || '';
//                 break;
//         }

//         // Enviar a Baileys
//         console.log(`📡 Enviando a Baileys: ${baileysUrl}`);
//         const response = await axios.post(baileysUrl, payload, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
//             },
//             timeout: 60000
//         });

//         console.log(`✅ Mensaje enviado correctamente`);

//         // Notificar al WebSocket para actualización en tiempo real (mensaje saliente del bot)
//         const idContacto = await getContactoIdByCelular(phone);
//         if (idContacto && message) {
//             console.log(`📡 Notificando WebSocket para mensaje saliente del bot, contacto ${idContacto}...`);
//             await notifyWebSocket(idContacto, {
//                 id: response.data?.messageId || response.data?.key?.id || `msg_${Date.now()}`,
//                 id_contacto: idContacto,
//                 contenido: message,
//                 direccion: 'out',  // 'out' para mensajes salientes del bot/asistente
//                 tipo: type || 'text',
//                 fecha_hora: new Date().toISOString()
//             });
//         }

//         console.log('======================================================');

//         res.json({
//             success: true,
//             message: 'Mensaje enviado correctamente',
//             data: {
//                 phone,
//                 type,
//                 message_sent: message || null,
//                 media_url: mediaUrl
//             },
//             response: response.data
//         });

//     } catch (error) {
//         console.error('❌ [webhook/send-whatsapp] Error:', error.message);

//         res.status(500).json({
//             success: false,
//             error: 'Error al enviar mensaje',
//             details: error.response?.data || error.message
//         });
//     }
// });

// /**
//  * POST /webhook/trigger
//  * Recibe mensajes de Baileys con codOpe y los envía a n8n
//  */
// router.post('/trigger',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Trigger para n8n'
//     async (req, res) => {
//     try {
//         const { codOpe } = req.body;

//         if (!codOpe) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Código de operación requerido'
//             });
//         }

//         if (codOpe !== 'ENVIAR_MENSAJE_WHATSAPP') {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Operación no válida'
//             });
//         }

//         // El campo "data" puede venir como string JSON o como objeto
//         let messageData = req.body.data;
//         if (typeof messageData === 'string') {
//             try {
//                 messageData = JSON.parse(messageData);
//             } catch (e) {
//                 return res.status(400).json({
//                     success: false,
//                     error: 'No se pudo decodificar los datos del mensaje'
//                 });
//             }
//         }

//         if (!messageData) {
//             messageData = req.body;
//         }

//         console.log('========== [webhook/trigger] MENSAJE WHATSAPP RECIBIDO ==========');
//         console.log('Data recibida:', JSON.stringify(messageData, null, 2));

//         // Extraer datos del mensaje
//         const sessionId = messageData.sessionId || messageData.EmpresaId || null;
//         // Limpiar número: remover @s.whatsapp.net, @lid, o cualquier sufijo @xxx
//         const fromNumber = messageData.fromNumber || messageData.from?.replace(/@.*$/, '') || null;
//         const messageText = messageData.messageText || messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '';
//         const messageTypes = messageData.messageTypes || ['text'];
//         const messageCount = messageData.messageCount || 1;
//         const bufferData = messageData.buffer || [];

//         const messageId = messageData.messageId || null;
//         const from = messageData.from || null;
//         const timestamp = messageData.timestamp || Date.now();
//         const pushName = messageData.pushName || 'Usuario';
//         const messageType = messageData.messageType || 'text';

//         console.log(`Session ID: ${sessionId}`);
//         console.log(`From Number: ${fromNumber}`);
//         console.log(`Message Types: ${messageTypes.join(', ')}`);
//         console.log(`Message Count: ${messageCount}`);
//         console.log(`Buffer Items: ${bufferData.length}`);

//         // Obtener ID del contacto y notificar al WebSocket para actualización en tiempo real
//         const idContacto = await getContactoIdByCelular(fromNumber);
//         console.log(`🔍 Buscando contacto para celular ${fromNumber}: idContacto = ${idContacto}`);

//         if (idContacto && messageText) {
//             console.log(`📡 Intentando notificar WebSocket para contacto ${idContacto}...`);
//             await notifyWebSocket(idContacto, {
//                 id: messageId || `msg_${Date.now()}`,
//                 id_contacto: idContacto,
//                 contenido: messageText,
//                 direccion: 'in',  // 'in' para mensajes entrantes del cliente
//                 tipo: messageType || 'text',
//                 fecha_hora: new Date(timestamp).toISOString()
//             });
//         } else {
//             console.log(`⚠️ No se notificará WebSocket: idContacto=${idContacto}, messageText=${messageText ? 'presente' : 'vacío'}`);
//         }

//         // Procesar archivos del buffer si existen
//         const uploadedFiles = processBufferFiles(bufferData, sessionId, fromNumber);

//         // Preparar payload para n8n
//         const payload = {
//             EmpresaId: sessionId,
//             messageId,
//             from,
//             fromNumber,
//             timestamp,
//             messageText,
//             pushName,
//             messageType,
//             messageTypes,
//             messageCount,
//             buffer: bufferData,
//             files: uploadedFiles
//         };

//         // Enviar a n8n
//         console.log(`📡 Enviando a n8n: ${CONFIG.N8N_WEBHOOK_URL}`);

//         const response = await axios.post(CONFIG.N8N_WEBHOOK_URL, payload, {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//             timeout: 30000,
//             maxRedirects: 5
//         });

//         const httpCode = response.status;
//         console.log(`✅ Mensaje enviado a n8n - HTTP ${httpCode}`);
//         console.log(`Archivos procesados: ${uploadedFiles.length}`);
//         console.log('================================================================');

//         res.json({
//             success: true,
//             message: 'Mensaje recibido y enviado a n8n',
//             data: {
//                 session_id: sessionId,
//                 from: fromNumber,
//                 mensaje: messageText,
//                 pushName,
//                 n8n_status: httpCode,
//                 message_types: messageTypes,
//                 message_count: messageCount,
//                 files_uploaded: uploadedFiles.length,
//                 files: uploadedFiles.map(f => ({
//                     index: f.index,
//                     type: f.type,
//                     filename: f.filename,
//                     size: f.size,
//                     mimetype: f.mimetype
//                 }))
//             }
//         });

//     } catch (error) {
//         console.error('❌ [webhook/trigger] Error:', error.message);

//         if (error.response) {
//             console.error('Response status:', error.response.status);
//             console.error('Response data:', error.response.data);
//         }

//         res.status(500).json({
//             success: false,
//             error: error.message,
//             details: error.response?.data || null
//         });
//     }
// });

// /**
//  * GET /webhook/test-download
//  * Endpoint de diagnóstico para probar descarga de archivos
//  */
// router.get('/test-download',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Test de descarga de archivos'
//     async (req, res) => {
//     const testUrl = req.query.url || 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';

//     console.log(`🧪 [test-download] Probando descarga: ${testUrl}`);

//     try {
//         const response = await axios.get(testUrl, {
//             responseType: 'arraybuffer',
//             timeout: 30000,
//             maxRedirects: 10,
//             httpsAgent,
//             decompress: false,
//             headers: {
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//                 'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
//                 'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
//                 'Accept-Encoding': 'identity',
//                 'Connection': 'keep-alive',
//                 'Cache-Control': 'no-cache'
//             }
//         });

//         res.json({
//             success: true,
//             url: testUrl,
//             status: response.status,
//             contentType: response.headers['content-type'],
//             size: response.data.byteLength,
//             sizeKB: (response.data.byteLength / 1024).toFixed(2),
//             firstBytes: Buffer.from(response.data).slice(0, 50).toString('hex')
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             url: testUrl,
//             error: error.message,
//             code: error.code,
//             status: error.response?.status,
//             statusText: error.response?.statusText,
//             responseHeaders: error.response?.headers,
//             responseData: error.response?.data ? Buffer.from(error.response.data).slice(0, 500).toString() : null
//         });
//     }
// });

// /**
//  * GET /webhook/bot-activo
//  * Verifica si un contacto tiene el bot activo
//  * Query params: celular, id_empresa (opcional)
//  */
// router.get('/bot-activo',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Verificar si bot está activo'
//     async (req, res) => {
//     const { celular, id_empresa } = req.query;

//     if (!celular) {
//         return res.status(400).json({
//             success: false,
//             error: 'El numero de celular es requerido'
//         });
//     }

//     try {
//         const idEmpresa = id_empresa ? parseInt(id_empresa, 10) : null;
//         const result = await isBotActivo(celular, idEmpresa);
//         res.json({
//             success: true,
//             celular,
//             id_empresa: idEmpresa,
//             ...result
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * GET /webhook/mensajes-en-visto
//  * Obtiene conversaciones fallidas (donde la última respuesta de la IA no es una despedida)
//  * Para uso en n8n
//  *
//  * Query params opcionales:
//  *   - id_contacto: filtrar por contacto específico
//  *   - limit: límite de resultados (default 100)
//  */
// router.get('/mensajes-en-visto',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener mensajes en visto'
//     async (req, res) => {
//     try {
//         const { id_contacto, limit } = req.query;

//         const filtros = {};
//         if (id_contacto) filtros.id_contacto = parseInt(id_contacto, 10);
//         if (limit) filtros.limit = parseInt(limit, 10);

//         console.log('========== [webhook/mensajes-en-visto] ==========');
//         console.log('Filtros:', filtros);

//         const resultado = await getMensajesEnVisto(filtros);

//         console.log(`✅ Encontrados ${resultado.cantidad_mensajes} registros`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/mensajes-en-visto] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * GET /webhook/argumentos-venta
//  * Obtiene todos los argumentos de venta activos
//  * Para uso en n8n
//  *
//  * Query params opcionales:
//  *   - id: obtener argumento específico
//  *   - estado_registro: filtrar por estado (default 1 = activo)
//  *   - limit: límite de resultados (default 100)
//  */
// router.get('/argumentos-venta',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener argumentos de venta'
//     async (req, res) => {
//     try {
//         const { id, estado_registro, limit } = req.query;

//         const filtros = {};
//         if (id) filtros.id = parseInt(id, 10);
//         if (estado_registro) filtros.estado_registro = parseInt(estado_registro, 10);
//         if (limit) filtros.limit = parseInt(limit, 10);

//         console.log('========== [webhook/argumentos-venta] GET ==========');
//         console.log('Filtros:', filtros);

//         const resultado = await getArgumentosVenta(filtros);

//         console.log(`✅ Encontrados ${resultado.total} argumentos`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/argumentos-venta] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * GET /webhook/argumentos-venta/:id
//  * Obtiene un argumento de venta por ID
//  */
// router.get('/argumentos-venta/:id',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener argumento de venta por ID'
//     async (req, res) => {
//     try {
//         const { id } = req.params;

//         console.log(`========== [webhook/argumentos-venta/${id}] GET ==========`);

//         const resultado = await getArgumentoVentaById(parseInt(id, 10));

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/argumentos-venta/:id] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * POST /webhook/argumentos-venta
//  * Crea un nuevo argumento de venta
//  * Body: { titulo, argumento }
//  */
// router.post('/argumentos-venta',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Crear argumento de venta'
//     async (req, res) => {
//     try {
//         const { titulo, argumento } = req.body;

//         console.log('========== [webhook/argumentos-venta] POST ==========');
//         console.log('Titulo:', titulo);

//         const resultado = await createArgumentoVenta(titulo, argumento);

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Argumento creado con ID ${resultado.id}`);

//         res.status(201).json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/argumentos-venta] POST Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * PUT /webhook/argumentos-venta/:id
//  * Actualiza un argumento de venta
//  * Body: { titulo?, argumento?, estado_registro? }
//  */
// router.put('/argumentos-venta/:id',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Actualizar argumento de venta'
//     async (req, res) => {
//     try {
//         const { id } = req.params;
//         const datos = req.body;

//         console.log(`========== [webhook/argumentos-venta/${id}] PUT ==========`);
//         console.log('Datos:', datos);

//         const resultado = await updateArgumentoVenta(parseInt(id, 10), datos);

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Argumento ${id} actualizado`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/argumentos-venta/:id] PUT Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * DELETE /webhook/argumentos-venta/:id
//  * Elimina (soft delete) un argumento de venta
//  */
// router.delete('/argumentos-venta/:id',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Eliminar argumento de venta'
//     async (req, res) => {
//     try {
//         const { id } = req.params;

//         console.log(`========== [webhook/argumentos-venta/${id}] DELETE ==========`);

//         const resultado = await deleteArgumentoVenta(parseInt(id, 10));

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Argumento ${id} eliminado`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/argumentos-venta/:id] DELETE Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // ==================== PERIODICIDAD RECORDATORIO ====================

// /**
//  * GET /webhook/periodicidad-recordatorio
//  * Obtiene todas las periodicidades de recordatorio activas
//  * Para uso en n8n
//  */
// router.get('/periodicidad-recordatorio',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener periodicidades de recordatorio'
//     async (req, res) => {
//     try {
//         console.log('========== [webhook/periodicidad-recordatorio] GET ==========');

//         const resultado = await getPeriodicidadRecordatorio();

//         console.log(`✅ Encontradas ${resultado.total} periodicidades`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/periodicidad-recordatorio] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * GET /webhook/periodicidad-recordatorio/:id
//  * Obtiene una periodicidad de recordatorio por ID
//  */
// router.get('/periodicidad-recordatorio/:id',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener periodicidad por ID'
//     async (req, res) => {
//     try {
//         const { id } = req.params;

//         console.log(`========== [webhook/periodicidad-recordatorio/${id}] GET ==========`);

//         const resultado = await getPeriodicidadRecordatorioById(parseInt(id, 10));

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/periodicidad-recordatorio/:id] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * POST /webhook/periodicidad-recordatorio
//  * Crea una nueva periodicidad de recordatorio
//  * Body: { nombre, cada_horas }
//  */
// router.post('/periodicidad-recordatorio',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Crear periodicidad de recordatorio'
//     async (req, res) => {
//     try {
//         const { nombre, cada_horas } = req.body;

//         console.log('========== [webhook/periodicidad-recordatorio] POST ==========');
//         console.log('Nombre:', nombre);
//         console.log('Cada horas:', cada_horas);

//         const resultado = await createPeriodicidadRecordatorio(nombre, cada_horas);

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Periodicidad creada con ID ${resultado.id}`);

//         res.status(201).json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/periodicidad-recordatorio] POST Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * PUT /webhook/periodicidad-recordatorio/:id
//  * Actualiza una periodicidad de recordatorio
//  * Body: { nombre?, cada_horas?, estado_registro? }
//  */
// router.put('/periodicidad-recordatorio/:id',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Actualizar periodicidad de recordatorio'
//     async (req, res) => {
//     try {
//         const { id } = req.params;
//         const datos = req.body;

//         console.log(`========== [webhook/periodicidad-recordatorio/${id}] PUT ==========`);
//         console.log('Datos:', datos);

//         const resultado = await updatePeriodicidadRecordatorio(parseInt(id, 10), datos);

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Periodicidad ${id} actualizada`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/periodicidad-recordatorio/:id] PUT Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * DELETE /webhook/periodicidad-recordatorio/:id
//  * Elimina (soft delete) una periodicidad de recordatorio
//  */
// router.delete('/periodicidad-recordatorio/:id',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Eliminar periodicidad de recordatorio'
//     async (req, res) => {
//     try {
//         const { id } = req.params;

//         console.log(`========== [webhook/periodicidad-recordatorio/${id}] DELETE ==========`);

//         const resultado = await deletePeriodicidadRecordatorio(parseInt(id, 10));

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Periodicidad ${id} eliminada`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/periodicidad-recordatorio/:id] DELETE Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // ==================== CONTACTO RECORDATORIOS ====================

// /**
//  * GET /webhook/contacto-recordatorios
//  * Obtiene todos los recordatorios de contactos activos
//  * Query params opcionales:
//  *   - id_contacto: filtrar por contacto específico
//  */
// router.get('/contacto-recordatorios',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener recordatorios de contactos'
//     async (req, res) => {
//     try {
//         const { id_contacto } = req.query;

//         console.log('========== [webhook/contacto-recordatorios] GET ==========');

//         const filtros = {};
//         if (id_contacto) filtros.id_contacto = parseInt(id_contacto, 10);

//         const resultado = await getContactoRecordatorios(filtros);

//         console.log(`✅ Encontrados ${resultado.total} recordatorios`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/contacto-recordatorios] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * GET /webhook/contacto-recordatorios/:id_contacto
//  * Obtiene el recordatorio de un contacto específico
//  */
// router.get('/contacto-recordatorios/:id_contacto',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Obtener recordatorio por contacto'
//     async (req, res) => {
//     try {
//         const { id_contacto } = req.params;

//         console.log(`========== [webhook/contacto-recordatorios/${id_contacto}] GET ==========`);

//         const resultado = await getRecordatorioByContactoId(parseInt(id_contacto, 10));

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/contacto-recordatorios/:id_contacto] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * POST /webhook/contacto-recordatorios/incrementar
//  * Incrementa o crea un recordatorio para un contacto
//  * - Si no existe: crea nuevo registro con cantidad = 1
//  * - Si existe: incrementa cantidad en 1
//  * - Si supera el límite: retorna limite_alcanzado = true
//  *
//  * Body: { id_contacto, limite_default? }
//  */
// router.post('/contacto-recordatorios/incrementar',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Incrementar recordatorio de contacto'
//     async (req, res) => {
//     try {
//         const { id_contacto, limite_default } = req.body;

//         console.log('========== [webhook/contacto-recordatorios/incrementar] POST ==========');
//         console.log('id_contacto:', id_contacto);

//         const resultado = await incrementarRecordatorio(
//             parseInt(id_contacto, 10),
//             limite_default ? parseInt(limite_default, 10) : undefined
//         );

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Recordatorio ${resultado.action}: cantidad=${resultado.cantidad}, limite=${resultado.limite}, limite_alcanzado=${resultado.limite_alcanzado}`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/contacto-recordatorios/incrementar] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * POST /webhook/contacto-recordatorios/resetear
//  * Resetea la cantidad de recordatorios de un contacto a 0
//  * Body: { id_contacto }
//  */
// router.post('/contacto-recordatorios/resetear',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Resetear recordatorio de contacto'
//     async (req, res) => {
//     try {
//         const { id_contacto } = req.body;

//         console.log('========== [webhook/contacto-recordatorios/resetear] POST ==========');
//         console.log('id_contacto:', id_contacto);

//         const resultado = await resetearRecordatorio(parseInt(id_contacto, 10));

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Recordatorio reseteado para contacto ${id_contacto}`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/contacto-recordatorios/resetear] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * PUT /webhook/contacto-recordatorios/:id_contacto/limite
//  * Actualiza el límite de recordatorios de un contacto
//  * Body: { limite }
//  */
// router.put('/contacto-recordatorios/:id_contacto/limite',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Actualizar límite de recordatorios'
//     async (req, res) => {
//     try {
//         const { id_contacto } = req.params;
//         const { limite } = req.body;

//         console.log(`========== [webhook/contacto-recordatorios/${id_contacto}/limite] PUT ==========`);
//         console.log('Nuevo limite:', limite);

//         const resultado = await actualizarLimiteRecordatorio(
//             parseInt(id_contacto, 10),
//             parseInt(limite, 10)
//         );

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Límite actualizado para contacto ${id_contacto}`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/contacto-recordatorios/:id_contacto/limite] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// /**
//  * DELETE /webhook/contacto-recordatorios/:id_contacto
//  * Elimina (soft delete) el recordatorio de un contacto
//  */
// router.delete('/contacto-recordatorios/:id_contacto',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Eliminar recordatorio de contacto'
//     async (req, res) => {
//     try {
//         const { id_contacto } = req.params;

//         console.log(`========== [webhook/contacto-recordatorios/${id_contacto}] DELETE ==========`);

//         const resultado = await deleteRecordatorio(parseInt(id_contacto, 10));

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Recordatorio eliminado para contacto ${id_contacto}`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/contacto-recordatorios/:id_contacto] DELETE Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// // ==================== OPENAI ====================

// /**
//  * POST /webhook/openai/generate
//  * Genera una respuesta usando OpenAI
//  *
//  * Headers:
//  *   Authorization: Bearer <API_KEY_OPENAI> (opcional - si no se envía, usa la del sistema)
//  *
//  * Body: {
//  *   prompt: string (requerido) - El prompt del usuario
//  *   systemPrompt?: string - Instrucciones del sistema (opcional)
//  *   model?: string - Modelo a usar (opcional, default "gpt-4.1")
//  *   temperature?: number - Temperatura (opcional, default 0.5)
//  * }
//  */
// router.post('/openai/generate',
//     // #swagger.tags = ['Webhook']
//     // #swagger.summary = 'Generar respuesta con OpenAI'
//     async (req, res) => {
//     try {
//         // Extraer API Key del header Authorization: Bearer <token> (opcional)
//         const authHeader = req.headers['authorization'];
//         const apiKey = authHeader && authHeader.startsWith('Bearer ')
//             ? authHeader.substring(7)
//             : null;

//         const { prompt, systemPrompt, model, temperature } = req.body;

//         console.log('========== [webhook/openai/generate] POST ==========');
//         console.log('Prompt:', prompt ? prompt.substring(0, 50) + '...' : 'No proporcionado');
//         console.log('Model:', model || 'gpt-4.1 (default)');
//         console.log('API Key:', apiKey ? 'Proporcionada por usuario' : 'Usando la del sistema');

//         if (!prompt) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Prompt es requerido'
//             });
//         }

//         const resultado = await openAIResponse({
//             apiKey,
//             prompt,
//             systemPrompt,
//             model,
//             temperature
//         });

//         if (!resultado.success) {
//             return res.status(400).json(resultado);
//         }

//         console.log(`✅ Respuesta generada correctamente`);

//         res.json(resultado);

//     } catch (error) {
//         console.error('❌ [webhook/openai/generate] Error:', error.message);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });

// module.exports = router;
