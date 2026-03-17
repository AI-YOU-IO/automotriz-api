const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta de uploads si no existe
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'plantillas');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `plantilla-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos según header_type
const fileFilter = (req, file, cb) => {
  const headerType = req.body.header_type || req.query.header_type;

  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedVideoTypes = ['video/mp4', 'video/3gpp'];
  const allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  let allowed = false;

  switch (headerType?.toUpperCase()) {
    case 'IMAGE':
      allowed = allowedImageTypes.includes(file.mimetype);
      if (!allowed) {
        return cb(new Error('Solo se permiten imágenes (JPEG, PNG)'), false);
      }
      break;
    case 'VIDEO':
      allowed = allowedVideoTypes.includes(file.mimetype);
      if (!allowed) {
        return cb(new Error('Solo se permiten videos (MP4, 3GPP)'), false);
      }
      break;
    case 'DOCUMENT':
      allowed = allowedDocumentTypes.includes(file.mimetype);
      if (!allowed) {
        return cb(new Error('Solo se permiten documentos (PDF, Word, Excel, PowerPoint)'), false);
      }
      break;
    default:
      // Si no hay header_type con media, permitir cualquier archivo de los tipos soportados
      allowed = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes].includes(file.mimetype);
      if (!allowed) {
        return cb(new Error('Tipo de archivo no permitido'), false);
      }
  }

  cb(null, true);
};

// Configuración de multer con límite de 100MB
const uploadPlantilla = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
}).single('media');

// Middleware wrapper para manejar errores
const uploadPlantillaMiddleware = (req, res, next) => {
  uploadPlantilla(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          msg: 'El archivo excede el límite de 100MB'
        });
      }
      return res.status(400).json({
        success: false,
        msg: `Error de upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        msg: err.message
      });
    }
    next();
  });
};

module.exports = { uploadPlantillaMiddleware };
