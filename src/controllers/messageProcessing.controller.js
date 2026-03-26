const AgenteGqm = require("../services/agente_gqm/agente_gqm.service");
const Prospecto = require("../repositories/prospecto.repository");
const Usuario = require("../repositories/usuario.repository");
const Chat = require("../repositories/chat.repository");
const Mensaje = require("../repositories/mensaje.repository");
const whatsappGraphService = require("../services/whatsapp/whatsappGraph.service");
const logger = require("../config/logger/loggerClient");
const configuracionWhatsappRepository = require("../repositories/configuracionWhatsapp.repository");

// Simple objeto en memoria para trackear errores únicos enviados
const erroresUnicosEnviados = {};

/**
 * Mapea el tipo de mensaje de WhatsApp al formato interno de la BD
 */
function mapearTipoMensaje(whatsappType) {
    const mapping = {
        'text': 'texto',
        'image': 'imagen',
        'audio': 'audio',
        'voice': 'audio',
        'document': 'documento',
        'video': 'video',
        'sticker': 'sticker',
        'location': 'ubicacion',
        'contacts': 'contacto'
    };
    return mapping[whatsappType] || 'texto';
}

/**
 * Lista completa de formatos soportados
 */
const FORMATOS_SOPORTADOS = {
    imagenes: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
    videos: ['.mp4', '.mov', '.avi', '.webm', '.3gp', '.mkv', '.flv'],
    audios: ['.mp3', '.ogg', '.wav', '.aac', '.m4a', '.opus', '.flac'],
    documentos: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf']
};

/**
 * Mapeo de formato a tipo de mensaje para WhatsApp
 */
const FORMATO_A_TIPO = {
    '.jpg': 'imagen', '.jpeg': 'imagen', '.png': 'imagen', '.gif': 'imagen', 
    '.webp': 'imagen', '.bmp': 'imagen', '.svg': 'imagen',
    '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.webm': 'video', 
    '.3gp': 'video', '.mkv': 'video', '.flv': 'video',
    '.mp3': 'audio', '.ogg': 'audio', '.wav': 'audio', '.aac': 'audio', 
    '.m4a': 'audio', '.opus': 'audio', '.flac': 'audio',
    '.pdf': 'documento', '.doc': 'documento', '.docx': 'documento', 
    '.xls': 'documento', '.xlsx': 'documento', '.ppt': 'documento', 
    '.pptx': 'documento', '.txt': 'documento', '.csv': 'documento', '.rtf': 'documento'
};

/**
 * URLs que contienen estos patrones se mantienen en el texto y no se extraen como media
 */
/**
 * Signos de apertura por los cuales se divide el mensaje en varios envíos.
 * Agregar aquí nuevos signos (ej: '¡') para ampliar el split.
 */
const DELIMITADORES_SPLIT = ['¿'];

const URLS_WHITELIST = [
    /google\.\w+\/maps/i,
    /maps\.google/i,
    /goo\.gl\/maps/i,
    /maps\.app\.goo\.gl/i
];

/**
 * Divide un texto usando los DELIMITADORES_SPLIT, conservando el delimitador al final de cada segmento.
 */
function splitPorDelimitadores(texto) {
    if (!texto || DELIMITADORES_SPLIT.length === 0) return [texto];

    const escaped = DELIMITADORES_SPLIT.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    // Splitea justo antes del delimitador de apertura, manteniendo el delimitador en el segmento siguiente
    const regex = new RegExp(`(?=${escaped})`, 'g');
    return texto.split(regex).map(s => s.trim()).filter(Boolean);
}

/**
 * Procesa todas las URLs encontradas en el texto en una sola pasada:
 * extrae, clasifica por formato y limpia el texto simultáneamente.
 */
function procesarMultiplesURLs(texto) {
    if (!texto) return { urlsEncontradas: [], textoLimpio: texto };

    const urlRegex = /(https?:\/\/[^\s\)\]]+|\/uploads\/[^\s\)\]]+)/gi;
    const urlsEncontradas = [];

    // Una sola pasada: reemplaza cada URL y clasifica en el mismo recorrido
    const textoSinURLs = texto.replace(urlRegex, (url) => {
        if (URLS_WHITELIST.some(pattern => pattern.test(url))) return url;

        const urlLower = url.toLowerCase();
        for (const [formato, tipo] of Object.entries(FORMATO_A_TIPO)) {
            if (urlLower.includes(formato)) {
                urlsEncontradas.push({ url: url.trim(), formato, tipo });
                break;
            }
        }
        return '';
    });

    // Limpieza de líneas vacías (markdown huérfano y caracteres de formato)
    const textoLimpio = textoSinURLs
        .split('\n')
        .filter(linea => linea.replace(/!?\[[^\]]*\]\(\s*\)/g, '').replace(/[-•*>\s]/g, '').length > 0)
        .join('\n')
        .trim();

    return { urlsEncontradas, textoLimpio };
}

async function enviarErrorUnico(body) {
    const { phone, id_empresa } = body || {};

    if (!phone || !id_empresa) {
        logger.error('[ERROR] No hay phone o id_empresa para enviar mensaje de error por WhatsApp');
        return;
    }

    if (erroresUnicosEnviados[phone]) {
        logger.warn(`[ERROR] Ya se envió un mensaje de error único a ${phone}. Omitiendo envío de WhatsApp (el error ya fue logueado arriba).`);
        return;
    }

    erroresUnicosEnviados[phone] = true;
    const mensajeError = "Lo siento, estoy teniendo problemas técnicos. Un asesor te atenderá pronto. 🙏";
    
    try {
        await whatsappGraphService.enviarMensajeTexto(
            parseInt(id_empresa, 10),
            phone.trim(),
            mensajeError
        );
        logger.info(`[ERROR] Mensaje de error único enviado a ${phone}`);
    } catch (e) {
        logger.error(`[ERROR CRÍTICO] No se pudo enviar mensaje de error único: ${e.message}`);
        delete erroresUnicosEnviados[phone];
    }
}

class MessageProcessingController {

    async processMessage(req, res) {
        // Responder inmediatamente a WhatsApp
        res.status(200).json({ 
            status: "received", 
            message: "Mensaje recibido" 
        });

        let paso = 'inicio';
        try {
            let {
                phone,
                question,
                wid,
                phone_number_id,
                messageType,
                messageTypes,
                messageCount,
                files
            } = req.body;
            
            try{
            id_empresa = await configuracionWhatsappRepository.findByPhoneNumberId(phone_number_id)
            id_empresa = id_empresa.id_empresa;
            }
            catch(error){
                logger.error(`[messageProcessing.controller.js] Error buscando configuración por phone_number_id: ${error.message}`);
                throw new Error(`Error buscando configuración por phone_number_id: ${error.message}`);
            }
            phone = phone?.trim() || '';
            question = question?.trim() || '';
            wid = wid ? wid.trim() : null;
            messageType = messageType || 'text';
            files = files || [];

            logger.info(`[messageProcessing.controller.js] Procesando mensaje - phone: ${phone}`);

            // 1. Buscar o crear prospecto
            paso = 'buscar/crear prospecto';
            let prospecto = await Prospecto.findByPhone(phone);
            if (!prospecto) {
                const asesores = await Usuario.findByRol(3, id_empresa);
                const ids = asesores.map(a => a.id);
                const ultimoAsignacion = await Prospecto.findLastAsignation();

                let id_asesor = null;
                if (ids.length > 0) {
                    if (ultimoAsignacion?.id_usuario) {
                        const indice = (ids.indexOf(ultimoAsignacion.id_usuario) + 1) % ids.length;
                        id_asesor = ids[indice];
                    } else {
                        id_asesor = ids[0];
                    }
                }

                prospecto = await Prospecto.create({
                    id_estado_prospecto: 1,
                    celular: phone,
                    id_usuario: id_asesor,
                    id_empresa,
                    nombre_completo: "Sin registrar",
                    usuario_registro: null
                });
            }

            // 2. Buscar o crear chat
            paso = 'buscar/crear chat';
            let chat = await Chat.findByProspecto(prospecto.id);
            if (!chat) {
                chat = await Chat.create({
                    id_prospecto: prospecto.id,
                    usuario_registro: null
                });
            }

            // 3. Guardar mensaje entrante
            paso = 'guardar mensaje entrante';
            const tipoMensajeBD = mapearTipoMensaje(messageType);
            let contenidoArchivo = files?.length > 0 ? files[0].url : null;

            await Mensaje.create({
                id_chat: chat.id,
                contenido: question || `[${tipoMensajeBD}]`,
                direccion: "in",
                wid_mensaje: wid,
                tipo_mensaje: tipoMensajeBD,
                contenido_archivo: contenidoArchivo,
                fecha_hora: new Date(),
                usuario_registro: null
            });

            // 4. Procesar con el asistente
            const bodyMessage ={
                id_empresa,
                phone,
                question,
                phone_number_id,
                id_chat: chat.id,
            }
            logger.info('[DEBUG] Tipos de bodyMessage:', {
                id_empresa: typeof id_empresa,
                phone: typeof phone,
                question: typeof question,
                phone_number_id: typeof phone_number_id,
                id_chat: typeof chat.id
            });
            try{
                await AgenteGqm.enviarMensaje(bodyMessage);
            }catch(error){
                logger.error(`[messageProcessing.controller.js] Error en procesamiento con asistente: ${error.message}`);
            }

            

            // 5. Procesar URLs
            paso = 'procesar URLs de respuesta';
            const { urlsEncontradas, textoLimpio } = procesarMultiplesURLs(respuestaTexto);

            // 6. Enviar respuestas
            paso = 'enviar respuesta texto por WhatsApp';
            if (textoLimpio) {
                const segmentos = splitPorDelimitadores(textoLimpio);
                for (const segmento of segmentos) {
                    try {
                        const resultadoTexto = await whatsappGraphService.enviarMensajeTexto(
                            id_empresa, phone, segmento
                        );

                        if (resultadoTexto?.wid_mensaje) {
                            await Mensaje.create({
                                id_chat: chat.id,
                                contenido: segmento,
                                direccion: "out",
                                wid_mensaje: resultadoTexto.wid_mensaje,
                                tipo_mensaje: 'texto',
                                fecha_hora: new Date(),
                                usuario_registro: null
                            });
                        }
                    } catch (error) {
                        logger.error(`[PASO: enviar texto] Error: ${error.message}`);
                    }
                }
            }

            // Enviar cada archivo
            for (const urlInfo of urlsEncontradas) {
                // Filtrar URLs HTTP - Meta requiere HTTPS para media
                if (urlInfo.url.startsWith('http://')) {
                    logger.warn(`[messageProcessing] URL HTTP detectada (no se enviará por WhatsApp): ${urlInfo.url}`);
                    continue;
                }

                paso = `enviar archivo ${urlInfo.tipo} (${urlInfo.url})`;
                try {
                    let resultadoEnvio = null;

                    switch (urlInfo.tipo) {
                        case 'imagen':
                            resultadoEnvio = await whatsappGraphService.enviarImagen(
                                id_empresa, phone, urlInfo.url, ''
                            );
                            break;
                        case 'video':
                            resultadoEnvio = await whatsappGraphService.enviarVideo(
                                id_empresa, phone, urlInfo.url, ''
                            );
                            break;
                        case 'audio':
                            resultadoEnvio = await whatsappGraphService.enviarAudio(
                                id_empresa, phone, urlInfo.url
                            );
                            break;
                        case 'documento':
                            const filename = urlInfo.url.split('/').pop() || 'documento';
                            resultadoEnvio = await whatsappGraphService.enviarDocumento(
                                id_empresa, phone, urlInfo.url, filename, ''
                            );
                            break;
                    }

                    if (resultadoEnvio?.wid_mensaje) {
                        await Mensaje.create({
                            id_chat: chat.id,
                            contenido: `[${urlInfo.tipo}]`,
                            direccion: "out",
                            wid_mensaje: resultadoEnvio.wid_mensaje,
                            tipo_mensaje: urlInfo.tipo,
                            contenido_archivo: urlInfo.url,
                            fecha_hora: new Date(),
                            usuario_registro: null
                        });
                    }
                } catch (error) {
                    logger.error(`[PASO: enviar ${urlInfo.tipo}] Error: ${error.message}`);
                }
            }

            // 7. Marcar prospecto como contactado
            paso = 'marcar prospecto como contactado';
            if (prospecto?.id && !prospecto.fue_contactado) {
                await Prospecto.update(prospecto.id, { fue_contactado: 1 });
            }

        } catch (error) {
            // Loguear el error con contexto específico del paso donde falló
            logger.error(`[ERROR en paso: "${paso}"] phone: ${req.body?.phone || 'N/A'} | ${error.message}`);
            logger.error(`[ERROR Stack] ${error.stack}`);
            // Enviar mensaje de error único al usuario por WhatsApp
            await enviarErrorUnico(req.body);
        }
    }
}

module.exports = new MessageProcessingController();