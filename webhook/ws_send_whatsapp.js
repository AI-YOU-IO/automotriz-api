const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const https = require('https');

// Agente HTTPS que ignora verificación SSL (como PHP cURL)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración
const CONFIG = {
    PORT: process.env.SEND_WS_PORT || 3031,
    BAILEYS_URL: process.env.BAILEYS_URL || 'https://bitel-baileys.xylure.easypanel.host',
    AUTH_TOKEN: process.env.BAILEYS_AUTH_TOKEN || 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961',
    SESSION_ID: process.env.SESSION_ID || 'bitel',
    SERVER_BASE_URL: process.env.SERVER_BASE_URL || 'https://portabilidad-bitel.ai-you.io'
};

/**
 * Convierte URL relativa a absoluta
 */
const getAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${CONFIG.SERVER_BASE_URL}${url}`;
};

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * Descargar archivo desde URL
 */
async function downloadFile(url, maxRetries = 2) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 120000,
                maxRedirects: 10,
                httpsAgent,
                decompress: false,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
                    'Accept-Encoding': 'identity',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache'
                }
            });

            const firstBytes = Buffer.from(response.data).slice(0, 100).toString();
            if (firstBytes.toLowerCase().includes('<html') || firstBytes.toLowerCase().includes('<!doctype')) {
                lastError = { error: 'Se recibió HTML en lugar del archivo', url };
                continue;
            }

            return {
                data: Buffer.from(response.data),
                contentType: response.headers['content-type'],
                size: response.data.byteLength
            };

        } catch (error) {
            lastError = { error: error.message, url };
        }
    }
    return lastError;
}

/**
 * Comprimir imagen
 */
async function compressImage(imageBuffer, maxWidth = 800, quality = 70, maxSizeKB = 50) {
    try {
        let compressed = await sharp(imageBuffer)
            .resize(maxWidth, null, { withoutEnlargement: true })
            .jpeg({ quality })
            .toBuffer();

        let currentQuality = quality;
        let currentWidth = maxWidth;

        while (compressed.length / 1024 > maxSizeKB && currentQuality >= 20) {
            currentQuality -= 10;
            if (currentQuality < 50 && currentWidth > 400) {
                currentWidth = Math.floor(currentWidth * 0.75);
            }
            compressed = await sharp(imageBuffer)
                .resize(currentWidth, null, { withoutEnlargement: true })
                .jpeg({ quality: currentQuality })
                .toBuffer();
        }

        return {
            data: compressed,
            contentType: 'image/jpeg',
            finalSize: compressed.length
        };

    } catch (error) {
        return { data: imageBuffer, contentType: 'image/jpeg', error: error.message };
    }
}

/**
 * Enviar mensaje a Baileys
 */
async function sendToBaileys(id_empresa, phone, message, imageUrl = null) {
    const baileysUrl = `${CONFIG.BAILEYS_URL}/session/${id_empresa}/send`;
    const results = [];

    if (imageUrl) {
        const absoluteImageUrl = getAbsoluteUrl(imageUrl);
        console.log(`🖼️ Descargando imagen: ${absoluteImageUrl}`);
        const downloaded = await downloadFile(absoluteImageUrl);

        if (!downloaded.error) {
            const compressed = await compressImage(downloaded.data);

            const imagePayload = {
                phone,
                media: compressed.data.toString('base64'),
                mimetype: compressed.contentType,
                message: message || ''
            };

            const imageResponse = await axios.post(baileysUrl, imagePayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
                },
                timeout: 30000
            });

            results.push({
                type: 'image',
                success: true,
                response: imageResponse.data,
                image_size_kb: (compressed.finalSize / 1024).toFixed(2)
            });

            return results;
        } else {
            console.error('❌ Error descargando imagen:', downloaded.error);
        }
    }

    if (message) {
        const textPayload = { phone, message };

        const textResponse = await axios.post(baileysUrl, textPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
            },
            timeout: 30000
        });

        results.push({
            type: 'text',
            success: true,
            response: textResponse.data
        });
    }

    return results;
}

/**
 * POST /send
 * Endpoint para n8n - Envía mensaje directo a WhatsApp
 *
 * Payload:
 * {
 *   "phone": "51999999999",
 *   "message": "Tu mensaje aquí",
 *   "image_url": "https://..." (opcional)
 * }
 */
app.post('/send', async (req, res) => {
    try {
        const { phone, message, image_url } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Número de teléfono requerido (phone)'
            });
        }

        if (!message && !image_url) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere mensaje (message) o imagen (image_url)'
            });
        }

        console.log('========== ENVIANDO MENSAJE WHATSAPP ==========');
        console.log(`📱 Phone: ${phone}`);
        console.log(`💬 Message: ${message ? message.substring(0, 50) + '...' : 'Sin texto'}`);
        console.log(`🖼️ Image: ${image_url || 'Sin imagen'}`);

        const results = await sendToBaileys(CONFIG.SESSION_ID, phone, message, image_url);

        console.log(`✅ Mensaje enviado correctamente`);
        console.log('================================================');

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            data: {
                phone,
                message_sent: message || null,
                image_sent: !!image_url
            },
            whatsapp_results: results
        });

    } catch (error) {
        console.error('❌ Error:', error.message);

        res.status(500).json({
            success: false,
            error: 'Error al enviar mensaje',
            details: error.response?.data || error.message
        });
    }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bitel WhatsApp Send Service (n8n)',
        timestamp: new Date().toISOString(),
        baileys_url: CONFIG.BAILEYS_URL
    });
});

// Iniciar servidor
app.listen(CONFIG.PORT, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 WhatsApp Send Service para n8n');
    console.log(`📡 Puerto: ${CONFIG.PORT}`);
    console.log(`🔗 Baileys: ${CONFIG.BAILEYS_URL}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Endpoint:');
    console.log('  POST /send');
    console.log('');
    console.log('Payload:');
    console.log('  { "phone": "51999999999", "message": "Hola", "image_url": "https://..." }');
    console.log('═══════════════════════════════════════════════════════════');
});

module.exports = app;
