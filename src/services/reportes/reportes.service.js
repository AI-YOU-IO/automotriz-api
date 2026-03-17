const ExcelJS = require('exceljs');
const TblClienteRestModel = require("../../models/tblProspectos.model.js");

class ReportesService {

  /**
   * Obtiene los datos del reporte diario
   * @param {string} fechaHoy - Fecha actual en formato YYYY-MM-DD
   * @returns {Promise<Object>} - Objeto con los datos del reporte
   */
  async getReporteDiario(fechaHoy) {
    try {
      const clienteRestModel = new TblClienteRestModel();
      const registro = await clienteRestModel.getConsumoByFechaAndTipo(fechaHoy, 'user') || {
        fecha_consumo: fechaHoy,
        count_consumo: 0
      };

      return registro;
    } catch (error) {
      throw new Error(`Error al obtener reporte diario: ${error.message}`);
    }
  }

  /**
   * Formatea una fecha de YYYY-MM-DD a DD/MM/YYYY
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {string} fechaHoy - Fecha de fallback
   * @returns {string} - Fecha formateada
   */
  formatearFecha(fecha, fechaHoy) {

    if (!fecha) return fechaHoy;
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  /**
   * Genera el HTML del reporte diario
   * @param {Object} registro - Datos del reporte
   * @param {string} fechaFormateada - Fecha formateada
   * @returns {string} - HTML del reporte
   */
  generarHTMLReporte(registro, fechaFormateada) {
    return `
        <html>
        <head>
          <title>Reporte Diario</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              padding: 20px;
            }
            
            .container { 
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              max-width: 500px;
              width: 100%;
            }
            
            .title {
              color: #2d3748;
              font-size: 2.5rem;
              font-weight: 700;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .info-card {
              background: linear-gradient(135deg, #f7fafc, #edf2f7);
              border-radius: 15px;
              padding: 25px;
              margin: 20px 0;
              border-left: 5px solid #667eea;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 15px 0;
              padding: 10px 0;
              border-bottom: 1px solid rgba(102, 126, 234, 0.1);
            }
            
            .info-item:last-child {
              border-bottom: none;
            }
            
            .info-label {
              color: #4a5568;
              font-weight: 600;
              font-size: 1.1rem;
            }
            
            .info-value {
              color: #2d3748;
              font-weight: 700;
              font-size: 1.2rem;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .download-btn {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 0.9rem;
              font-weight: 600;
              border-radius: 25px;
              cursor: pointer;
              margin-top: 20px;
              transition: all 0.3s ease;
              box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .download-btn:hover {
              transform: translateY(-3px);
              box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
              background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            }
            
            .download-btn:active {
              transform: translateY(-1px);
            }
            
            .icon {
              margin-right: 10px;
              font-size: 1.2rem;
            }
            
            @media (max-width: 600px) {
              .container {
                padding: 30px 20px;
                margin: 10px;
              }
              
              .title {
                font-size: 2rem;
              }
              
              .info-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="title">Reporte Diario (INEI)</h1>
            
            <div class="info-card">
              <div class="info-item">
                <span class="info-label">📅 Fecha</span>
                <span class="info-value">${fechaFormateada}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📈 Consumo</span>
                <span class="info-value">${registro.count_consumo}</span>
              </div>
            </div>
            
            <form action="/api/reporte-download/excel" method="get">
              <button type="submit" class="download-btn">
                <span class="icon">📥</span>
                Descargar reporte completo Excel
              </button>
            </form>
          </div>
        </body>
        </html>
      `;
  }

  /**
   * Obtiene todos los datos para el reporte Excel
   * @returns {Promise<Array>} - Array con todos los registros de consumo
   */
  async getDatosReporteExcel() {
    try {
      const clienteRestModel = new TblClienteRestModel();
      const rows = await clienteRestModel.getAllConsumoByTipo('user');
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener datos para Excel: ${error.message}`);
    }
  }

  /**
   * Genera el archivo Excel con los datos de consumo
   * @param {Array} rows - Datos para el Excel
   * @returns {Promise<Object>} - Workbook de ExcelJS
   */
  async generarExcel(rows) {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Consumo Diario');

      sheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Consumo', key: 'consumo', width: 10 }
      ];

      rows.forEach(r => sheet.addRow({ fecha: r.fecha_consumo, consumo: r.count_consumo }));

      return workbook;
    } catch (error) {
      throw new Error(`Error al generar Excel: ${error.message}`);
    }
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns {string} - Fecha actual formateada
   */
  obtenerFechaActual() {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `${anio}-${mes}-${dia}`;
  }
}

module.exports = new ReportesService();
