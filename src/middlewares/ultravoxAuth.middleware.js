/**
 * Middleware de autenticación por Bearer token para webhooks de Ultravox
 */
const authUltravoxToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado. Use: Authorization: Bearer <token>' });
  }

  const token = authHeader.replace('Bearer ', '');
  const validToken = process.env.ULTRAVOX_API_TOKEN;

  if (!validToken) {
    return res.status(500).json({ message: 'ULTRAVOX_API_TOKEN no configurado en el servidor' });
  }

  if (token !== validToken) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  req.user = { userId: 'ultravox', idEmpresa: null };
  next();
};

module.exports = { authUltravoxToken };
