/**
 * Servicio para comunicación con la API de Maravia
 * Maneja autenticación M2M usando API Key → JWT
 */

const axios = require('axios');
const logger = require('../../config/logger/loggerClient.js');

class MaraviaApiService {
  constructor() {
    this.baseUrl = process.env.MARAVIA_API_URL || 'https://api.maravia.pe/servicio';
    this.apiKey = process.env.MARAVIA_API_KEY;
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtiene un JWT válido usando la API Key
   * Renueva automáticamente si está por expirar (5 min antes)
   */
  async getToken() {
    // Si el token existe y no expira en los próximos 5 minutos, usarlo
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return this.token;
    }

    if (!this.apiKey) {
      throw new Error('MARAVIA_API_KEY no está configurada en las variables de entorno');
    }

    try {
      logger.info('[MaraviaApi] Obteniendo nuevo JWT con API Key');

      const response = await axios.post(`${this.baseUrl}/ws_auth_external.php`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 10000
      });

      if (response.data.success) {
        this.token = response.data.token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        logger.info(`[MaraviaApi] JWT obtenido para sistema: ${response.data.sistema}`);
        return this.token;
      } else {
        throw new Error(response.data.error || 'Error obteniendo token de Maravia');
      }
    } catch (error) {
      logger.error(`[MaraviaApi] Error autenticando: ${error.message}`);
      throw error;
    }
  }

  /**
   * Realiza una petición autenticada a la API de Maravia
   */
  async request(endpoint, data = {}) {
    const token = await this.getToken();

    try {
      const response = await axios.post(`${this.baseUrl}/${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      // Si el error es 401, limpiar token e intentar de nuevo
      if (error.response?.status === 401) {
        logger.warn('[MaraviaApi] Token expirado, renovando...');
        this.token = null;
        this.tokenExpiry = null;

        const newToken = await this.getToken();
        const retryResponse = await axios.post(`${this.baseUrl}/${endpoint}`, data, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          timeout: 30000
        });

        return retryResponse.data;
      }

      logger.error(`[MaraviaApi] Error en petición a ${endpoint}: ${error.message}`);
      throw error;
    }
  }
}

// Singleton
module.exports = new MaraviaApiService();
