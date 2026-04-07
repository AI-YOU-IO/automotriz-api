/**
 * Servicio para interactuar con la Graph API de Facebook/WhatsApp
 * Usa las credenciales guardadas en configuracion_whatsapp
 */

const axios = require('axios');
const fs = require('fs');
const configuracionWhatsappRepository = require('../../repositories/configuracionWhatsapp.repository.js');
const logger = require('../../config/logger/loggerClient.js');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Credenciales de Maravia para Coexistence (siempre presentes en env)
const MARAVIA_ACCESS_TOKEN = process.env.MARAVIA_ACCESS_TOKEN;
const MARAVIA_APP_SECRET = process.env.MARAVIA_APP_SECRET;

class WhatsappGraphService {
  /**
   * Obtiene las credenciales de WhatsApp para una empresa
   * Usa el token de Maravia (Coexistence) y solo el phone_number_id de la BD
   */
  async obtenerCredenciales(idEmpresa) {
    const config = await configuracionWhatsappRepository.findByEmpresaId(idEmpresa);
    if (!config) {
      throw new Error(`No se encontraron credenciales de WhatsApp para la empresa ${idEmpresa}`);
    }

    if (!config.numero_telefono_id) {
      throw new Error(`No se encontró numero_telefono_id para la empresa ${idEmpresa}`);
    }

    // Usar token de Maravia (Coexistence) - siempre presente en env
    if (!MARAVIA_ACCESS_TOKEN) {
      throw new Error('MARAVIA_ACCESS_TOKEN no está configurado en las variables de entorno');
    }

    logger.info(`[WhatsappGraph] Usando token de Maravia (coexistence) para empresa: ${idEmpresa}, phone_number_id: ${config.numero_telefono_id}`);

    return {
      accessToken: MARAVIA_ACCESS_TOKEN,
      phoneNumberId: config.numero_telefono_id,
      wabaId: config.waba_id,
      appId: config.app_id
    };
  }

  /**
   * Obtiene el WABA ID desde el Phone Number ID si no está guardado
   */
  async obtenerWabaIdDesdePhoneNumber(phoneNumberId, accessToken) {
    try {
      const url = `${GRAPH_API_URL}/${phoneNumberId}?fields=whatsapp_business_account`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 30000
      });
      return response.data?.whatsapp_business_account?.id || null;
    } catch (error) {
      logger.error(`[WhatsappGraph] Error obteniendo WABA ID: ${error.message}`);
      return null;
    }
  }

  /**
   * Lista las plantillas de mensajes de WhatsApp Business desde Meta
   */
  async listarPlantillas(idEmpresa, options = {}) {
    logger.info(`[WhatsappGraph] ========== LISTAR PLANTILLAS ==========`);
    logger.info(`[WhatsappGraph] idEmpresa: ${idEmpresa}, options: ${JSON.stringify(options)}`);

    const credenciales = await this.obtenerCredenciales(idEmpresa);
    logger.info(`[WhatsappGraph] Credenciales obtenidas - wabaId: ${credenciales.wabaId}, phoneNumberId: ${credenciales.phoneNumberId}, tokenLength: ${credenciales.accessToken?.length || 0}`);

    let wabaId = credenciales.wabaId;

    if (!wabaId) {
      logger.info(`[WhatsappGraph] wabaId no encontrado en BD, obteniendo desde phoneNumber...`);
      wabaId = await this.obtenerWabaIdDesdePhoneNumber(credenciales.phoneNumberId, credenciales.accessToken);
      if (!wabaId) {
        logger.error(`[WhatsappGraph] No se pudo obtener WABA ID`);
        throw new Error('No se pudo obtener el WhatsApp Business Account ID');
      }
      logger.info(`[WhatsappGraph] wabaId obtenido desde API: ${wabaId}`);
    }

    const fields = 'name,status,category,language,components,quality_score,rejected_reason';
    const limit = options.limit || 100;
    let url = `${GRAPH_API_URL}/${wabaId}/message_templates?fields=${fields}&limit=${limit}`;

    if (options.status) {
      url += `&status=${encodeURIComponent(options.status)}`;
    }

    logger.info(`[WhatsappGraph] URL de Meta: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${credenciales.accessToken}` },
        timeout: 30000
      });

      logger.info(`[WhatsappGraph] Respuesta Meta - Status: ${response.status}`);
      logger.info(`[WhatsappGraph] Respuesta Meta - Data keys: ${Object.keys(response.data || {}).join(', ')}`);
      logger.info(`[WhatsappGraph] Respuesta Meta - Templates count: ${response.data?.data?.length || 0}`);

      const templates = (response.data?.data || []).map(template => ({
        id: template.id || null,
        name: template.name || '',
        status: template.status || '',
        category: template.category || '',
        language: template.language || '',
        components: template.components || [],
        quality_score: template.quality_score || null,
        rejected_reason: template.rejected_reason || null
      }));

      logger.info(`[WhatsappGraph] Templates procesados: ${templates.length}`);
      if (templates.length > 0) {
        logger.info(`[WhatsappGraph] Primeras 3 plantillas: ${templates.slice(0, 3).map(t => t.name).join(', ')}`);
      }

      return {
        success: true,
        templates,
        total: templates.length,
        waba_id: wabaId,
        paging: response.data?.paging || null
      };
    } catch (axiosError) {
      logger.error(`[WhatsappGraph] Error en llamada a Meta: ${axiosError.message}`);
      logger.error(`[WhatsappGraph] Status: ${axiosError.response?.status}`);
      logger.error(`[WhatsappGraph] Response data: ${JSON.stringify(axiosError.response?.data || {})}`);
      throw axiosError;
    }
  }

  /**
   * Crea una nueva plantilla de mensaje en Meta
   */
  async crearPlantilla(idEmpresa, name, category, language, components) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    let wabaId = credenciales.wabaId;

    if (!wabaId) {
      wabaId = await this.obtenerWabaIdDesdePhoneNumber(credenciales.phoneNumberId, credenciales.accessToken);
      if (!wabaId) {
        throw new Error('No se pudo obtener el WhatsApp Business Account ID');
      }
    }

    const url = `${GRAPH_API_URL}/${wabaId}/message_templates`;
    const payload = {
      name,
      category: category.toUpperCase(),
      language,
      components: this.formatearComponentesParaCreacion(components)
    };

    logger.info(`[WhatsappGraph] Creando plantilla en Meta: ${name}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credenciales.accessToken}`
      },
      timeout: 30000
    });

    return {
      success: true,
      id: response.data?.id || null,
      status: response.data?.status || 'PENDING',
      category: response.data?.category || category
    };
  }

  /**
   * Edita una plantilla existente en Meta
   */
  async editarPlantilla(idEmpresa, templateId, components) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${templateId}`;

    // Los componentes ya vienen formateados de convertirDatosAComponentes
    // Solo necesitamos formatearlos para Meta (agregar examples, etc)
    const componentesFormateados = this.formatearComponentesParaCreacion(components);

    const payload = {
      components: componentesFormateados
    };

    logger.info(`[WhatsappGraph] Editando plantilla en Meta: ${templateId}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credenciales.accessToken}`
      },
      timeout: 30000
    });

    return {
      success: true,
      data: response.data
    };
  }

  /**
   * Elimina una plantilla en Meta
   */
  async eliminarPlantilla(idEmpresa, name) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    let wabaId = credenciales.wabaId;

    if (!wabaId) {
      wabaId = await this.obtenerWabaIdDesdePhoneNumber(credenciales.phoneNumberId, credenciales.accessToken);
      if (!wabaId) {
        throw new Error('No se pudo obtener el WhatsApp Business Account ID');
      }
    }

    const url = `${GRAPH_API_URL}/${wabaId}/message_templates?name=${encodeURIComponent(name)}`;

    logger.info(`[WhatsappGraph] Eliminando plantilla en Meta: ${name}`);

    const response = await axios.delete(url, {
      headers: { Authorization: `Bearer ${credenciales.accessToken}` },
      timeout: 30000
    });

    return {
      success: true,
      data: response.data
    };
  }

  /**
   * Envía un mensaje de texto simple
   */
  async enviarMensajeTexto(idEmpresa,phoneNumberId, phone, message) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${phoneNumberId}/messages`;
    const formattedPhone = this.formatearNumeroTelefono(phone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: message
      }
    };

    logger.info(`[WhatsappGraph] Enviando mensaje de texto a ${formattedPhone}`);

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credenciales.accessToken}`
      },
      timeout: 30000
    });

    const wid_mensaje = response.data?.messages?.[0]?.id || null;

    return {
      success: true,
      wid_mensaje,
      response: response.data
    };
  }

  /**
   * Envía una imagen
   */
  async enviarImagen(idEmpresa, phone, imageUrl, caption = '') {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${credenciales.phoneNumberId}/messages`;
    const formattedPhone = this.formatearNumeroTelefono(phone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'image',
      image: {
        link: imageUrl
      }
    };

    if (caption) {
      payload.image.caption = caption;
    }

    logger.info(`[WhatsappGraph] Enviando imagen a ${formattedPhone}`);
    logger.info(`[WhatsappGraph] URL de imagen: ${imageUrl}`);
    logger.info(`[WhatsappGraph] Payload: ${JSON.stringify(payload)}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credenciales.accessToken}`
        },
        timeout: 30000
      });

      logger.info(`[WhatsappGraph] Respuesta API WhatsApp: ${JSON.stringify(response.data)}`);

      const wid_mensaje = response.data?.messages?.[0]?.id || null;

      return {
        success: true,
        wid_mensaje,
        response: response.data
      };
    } catch (error) {
      logger.error(`[WhatsappGraph] Error enviando imagen: ${error.message}`);
      logger.error(`[WhatsappGraph] Error response: ${JSON.stringify(error.response?.data || {})}`);
      throw error;
    }
  }

  /**
   * Envía un documento
   */
  async enviarDocumento(idEmpresa, phone, documentUrl, filename, caption = '') {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${credenciales.phoneNumberId}/messages`;
    const formattedPhone = this.formatearNumeroTelefono(phone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'document',
      document: {
        link: documentUrl,
        filename: filename
      }
    };

    if (caption) {
      payload.document.caption = caption;
    }

    logger.info(`[WhatsappGraph] Enviando documento a ${formattedPhone}`);
    logger.info(`[WhatsappGraph] URL del documento: ${documentUrl}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credenciales.accessToken}`
        },
        timeout: 30000
      });

      logger.info(`[WhatsappGraph] Respuesta envío documento: ${JSON.stringify(response.data)}`);

      const wid_mensaje = response.data?.messages?.[0]?.id || null;

      return {
        success: true,
        wid_mensaje,
        response: response.data
      };
    } catch (error) {
      logger.error(`[WhatsappGraph] Error enviando documento: ${error.message}`);
      logger.error(`[WhatsappGraph] Error response: ${JSON.stringify(error.response?.data || {})}`);
      throw error;
    }
  }

  /**
   * Envía un audio
   */
  async enviarAudio(idEmpresa, phone, audioUrl) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${credenciales.phoneNumberId}/messages`;
    const formattedPhone = this.formatearNumeroTelefono(phone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'audio',
      audio: {
        link: audioUrl
      }
    };

    logger.info(`[WhatsappGraph] Enviando audio a ${formattedPhone}`);
    logger.info(`[WhatsappGraph] URL del audio: ${audioUrl}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credenciales.accessToken}`
        },
        timeout: 30000
      });

      logger.info(`[WhatsappGraph] Respuesta envío audio: ${JSON.stringify(response.data)}`);

      const wid_mensaje = response.data?.messages?.[0]?.id || null;

      return {
        success: true,
        wid_mensaje,
        response: response.data
      };
    } catch (error) {
      logger.error(`[WhatsappGraph] Error enviando audio: ${error.message}`);
      logger.error(`[WhatsappGraph] Error response: ${JSON.stringify(error.response?.data || {})}`);
      throw error;
    }
  }

  /**
   * Envía un video
   */
  async enviarVideo(idEmpresa, phone, videoUrl, caption = '') {
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    const url = `${GRAPH_API_URL}/${credenciales.phoneNumberId}/messages`;
    const formattedPhone = this.formatearNumeroTelefono(phone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'video',
      video: {
        link: videoUrl
      }
    };

    if (caption) {
      payload.video.caption = caption;
    }

    logger.info(`[WhatsappGraph] Enviando video a ${formattedPhone}`);
    logger.info(`[WhatsappGraph] URL del video: ${videoUrl}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credenciales.accessToken}`
        },
        timeout: 30000
      });

      logger.info(`[WhatsappGraph] Respuesta envío video: ${JSON.stringify(response.data)}`);

      const wid_mensaje = response.data?.messages?.[0]?.id || null;

      return {
        success: true,
        wid_mensaje,
        response: response.data
      };
    } catch (error) {
      logger.error(`[WhatsappGraph] Error enviando video: ${error.message}`);
      logger.error(`[WhatsappGraph] Error response: ${JSON.stringify(error.response?.data || {})}`);
      throw error;
    }
  }

  /**
   * Envía un mensaje de plantilla
   */
  async enviarPlantilla(idEmpresa, phone, templateName, language = 'es', components = []) {
    logger.info(`[WhatsappGraph] ========== ENVIAR PLANTILLA ==========`);
    logger.info(`[WhatsappGraph] idEmpresa: ${idEmpresa}, phone: ${phone}, template: ${templateName}, lang: ${language}`);

    // Obtener credenciales
    logger.info(`[WhatsappGraph] Obteniendo credenciales...`);
    const credenciales = await this.obtenerCredenciales(idEmpresa);
    logger.info(`[WhatsappGraph] Credenciales OK - phoneNumberId: ${credenciales.phoneNumberId}, tokenLength: ${credenciales.accessToken?.length || 0}`);

    const url = `${GRAPH_API_URL}/${credenciales.phoneNumberId}/messages`;
    logger.info(`[WhatsappGraph] URL: ${url}`);

    const formattedPhone = this.formatearNumeroTelefono(phone);
    logger.info(`[WhatsappGraph] Teléfono formateado: ${formattedPhone}`);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language }
      }
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    logger.info(`[WhatsappGraph] Payload: ${JSON.stringify(payload)}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credenciales.accessToken}`
        },
        timeout: 30000
      });

      logger.info(`[WhatsappGraph] Respuesta OK - Status: ${response.status}`);
      logger.info(`[WhatsappGraph] Response data: ${JSON.stringify(response.data)}`);

      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      const metaError = error.response?.data?.error || {};
      logger.error(`[WhatsappGraph] ========== ERROR ENVIAR PLANTILLA ==========`);
      logger.error(`[WhatsappGraph] Status HTTP: ${error.response?.status || 'N/A'}`);
      logger.error(`[WhatsappGraph] Meta error code: ${metaError.code || 'N/A'}, subcode: ${metaError.error_subcode || 'N/A'}`);
      logger.error(`[WhatsappGraph] Meta error message: ${metaError.message || error.message}`);
      logger.error(`[WhatsappGraph] Meta error type: ${metaError.type || 'N/A'}`);
      logger.error(`[WhatsappGraph] URL: ${url}`);
      logger.error(`[WhatsappGraph] Template: ${templateName}, Phone: ${formattedPhone}, WABA: ${credenciales.wabaId}`);
      logger.error(`[WhatsappGraph] Full response: ${JSON.stringify(error.response?.data || {})}`);
      logger.error(`[WhatsappGraph] ============================================`);
      throw error;
    }
  }

  /**
   * Sube un archivo de media a Meta y retorna el media_handle para usar en plantillas
   * @param {number} idEmpresa - ID de la empresa
   * @param {string} filePath - Ruta del archivo local
   * @param {string} mimeType - Tipo MIME del archivo
   * @returns {Promise<string>} - Media handle para usar en la plantilla
   */
  async subirMediaParaPlantilla(idEmpresa, filePath, mimeType) {
    const credenciales = await this.obtenerCredenciales(idEmpresa);

    logger.info(`[WhatsappGraph] Subiendo media para plantilla: ${filePath}, mimeType: ${mimeType}`);

    // Paso 1: Crear sesión de upload
    const createSessionUrl = `${GRAPH_API_URL}/${credenciales.appId}/uploads`;
    const fileStats = fs.statSync(filePath);
    const fileLength = fileStats.size;

    const sessionResponse = await axios.post(createSessionUrl, null, {
      params: {
        file_name: filePath.split(/[/\\]/).pop(),
        file_length: fileLength,
        file_type: mimeType,
        access_token: credenciales.accessToken
      },
      timeout: 30000
    });

    const uploadSessionId = sessionResponse.data?.id;
    if (!uploadSessionId) {
      throw new Error('No se pudo crear la sesión de upload');
    }

    logger.info(`[WhatsappGraph] Sesión de upload creada: ${uploadSessionId}`);

    // Paso 2: Subir el archivo
    const fileBuffer = fs.readFileSync(filePath);
    const uploadUrl = `${GRAPH_API_URL}/${uploadSessionId}`;

    const uploadResponse = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        'Authorization': `OAuth ${credenciales.accessToken}`,
        'file_offset': '0',
        'Content-Type': 'application/octet-stream'
      },
      timeout: 120000 // 2 minutos para archivos grandes
    });

    const mediaHandle = uploadResponse.data?.h;
    if (!mediaHandle) {
      throw new Error('No se pudo obtener el media handle');
    }

    logger.info(`[WhatsappGraph] Media subida exitosamente, handle: ${mediaHandle}`);
    return mediaHandle;
  }

  /**
   * Formatea número de teléfono para WhatsApp Cloud API
   */
  formatearNumeroTelefono(phone) {
    let formatted = phone.replace(/[\s\-\(\)\+]/g, '');
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    if (formatted.length <= 9) {
      formatted = '51' + formatted;
    }
    return formatted;
  }

  /**
   * Convierte los datos de BD al formato de componentes de Meta API
   * @param {Object} plantilla - Datos de la plantilla
   * @param {string} mediaHandle - Handle de media subida a Meta (opcional)
   */
  convertirDatosAComponentes(plantilla, mediaHandle = null) {
    const components = [];

    // Header
    if (plantilla.header_type) {
      const headerType = plantilla.header_type.toUpperCase();
      const headerComp = {
        type: 'HEADER',
        format: headerType
      };

      if (headerType === 'TEXT' && plantilla.header_text) {
        headerComp.text = plantilla.header_text;
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
        // Para media, necesitamos el handle
        if (mediaHandle) {
          headerComp.example = { header_handle: [mediaHandle] };
        }
      }

      components.push(headerComp);
    }

    // Body (obligatorio)
    if (plantilla.body) {
      components.push({
        type: 'BODY',
        text: plantilla.body
      });
    }

    // Footer
    if (plantilla.footer) {
      components.push({
        type: 'FOOTER',
        text: plantilla.footer
      });
    }

    // Buttons
    if (plantilla.buttons && Array.isArray(plantilla.buttons) && plantilla.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: plantilla.buttons
      });
    }

    return components;
  }

  /**
   * Formatea los componentes para la creación de plantilla según el formato de Meta API
   */
  formatearComponentesParaCreacion(components) {
    const formatted = [];

    for (const comp of components) {
      const type = (comp.type || '').toUpperCase();

      switch (type) {
        case 'HEADER':
          const format = (comp.format || 'TEXT').toUpperCase();
          if (format === 'TEXT' && comp.text) {
            const header = { type: 'HEADER', format: 'TEXT', text: comp.text };
            if (comp.example?.header_text) {
              header.example = { header_text: comp.example.header_text };
            } else if (/\{\{\w+\}\}/.test(comp.text)) {
              const matches = comp.text.match(/\{\{(\w+)\}\}/g) || [];
              header.example = { header_text: matches.map((_, i) => `ejemplo_${i + 1}`) };
            }
            formatted.push(header);
          } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(format)) {
            const headerMedia = { type: 'HEADER', format };
            if (comp.example?.header_handle) {
              headerMedia.example = { header_handle: comp.example.header_handle };
            }
            formatted.push(headerMedia);
          }
          break;

        case 'BODY':
          const body = { type: 'BODY', text: comp.text || '' };
          if (comp.example?.body_text) {
            body.example = { body_text: comp.example.body_text };
          } else {
            const matches = body.text.match(/\{\{(\d+)\}\}/g) || [];
            if (matches.length > 0) {
              body.example = { body_text: [matches.map((_, i) => `ejemplo_${i + 1}`)] };
            }
          }
          formatted.push(body);
          break;

        case 'FOOTER':
          if (comp.text) {
            formatted.push({ type: 'FOOTER', text: comp.text });
          }
          break;

        case 'BUTTONS':
          if (comp.buttons && Array.isArray(comp.buttons)) {
            const buttons = [];
            for (const btn of comp.buttons) {
              const buttonType = (btn.type || 'QUICK_REPLY').toUpperCase();
              switch (buttonType) {
                case 'QUICK_REPLY':
                  buttons.push({ type: 'QUICK_REPLY', text: btn.text || 'Botón' });
                  break;
                case 'URL':
                  const urlBtn = { type: 'URL', text: btn.text || 'Ver más', url: btn.url || '' };
                  if (urlBtn.url.includes('{{')) {
                    urlBtn.example = ['https://ejemplo.com/valor'];
                  }
                  buttons.push(urlBtn);
                  break;
                case 'PHONE_NUMBER':
                  buttons.push({ type: 'PHONE_NUMBER', text: btn.text || 'Llamar', phone_number: btn.phone_number || '' });
                  break;
                case 'COPY_CODE':
                  buttons.push({ type: 'COPY_CODE', example: btn.example || 'CODIGO123' });
                  break;
              }
            }
            if (buttons.length > 0) {
              formatted.push({ type: 'BUTTONS', buttons });
            }
          }
          break;
      }
    }

    return formatted;
  }
}

module.exports = new WhatsappGraphService();
