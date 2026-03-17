/**
 * Middleware para respuestas JSON consistentes
 */

const formatData = (data) => {
  return Array.isArray(data) && data.length > 0
    ? data
    : (data && typeof data === 'object' && Object.keys(data).length > 0)
      ? [data]
      : [];
}

// Handler para respuestas exitosas 
const successResponse = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    message,
    data: formatData(data), // Un array de objetos
    timestamp: new Date().toISOString()
  });
};

// Handler para respuestas de error del cliente
const clientError = (res, statusCode, message = 'Client Error', details = "") => {
  return res.status(statusCode).json({
    message,
    details: formatData(details),  // Un array de objetos 
    timestamp: new Date().toISOString()
  });
};

// Handler para respuestas de error del servidor
const serverError = (res, statusCode, message, details) => {
  return res.status(statusCode).json({
    message,
    details: formatData(details),  // Un array de objetos
    timestamp: new Date().toISOString()
  });
};

// Middleware para agregar métodos de respuesta a res
const responseHandler = (req, res, next) => {
  res.success = (statusCode = 200, message = 'Success', data = []) => successResponse(res, statusCode, message, data);
  res.clientError = (statusCode = 400, message = 'Client Error', details = []) => clientError(res, statusCode, message, details);
  res.serverError = (statusCode = 500, message = 'Internal Server Error', details = []) => serverError(res, statusCode, message, details);

  next();
};

module.exports = {
  successResponse,
  clientError,
  serverError,
  responseHandler
}; 