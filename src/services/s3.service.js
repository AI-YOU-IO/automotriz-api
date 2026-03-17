/**
 * Servicio para manejo de archivos en AWS S3
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../config/logger/loggerClient');

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.S3_BUCKET || 'aiyou-uploads';
const PLATFORM_FOLDER = process.env.S3_PLATFORM_FOLDER || 'inmobiliaria';

/**
 * Normaliza el nombre del tipo de recurso para usarlo como carpeta
 * Elimina acentos, espacios y caracteres especiales
 */
const normalizeFolderName = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, '-') // Reemplazar caracteres especiales por guiones
    .replace(/-+/g, '-') // Eliminar guiones múltiples
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final
};

/**
 * Genera la ruta del archivo en S3
 * Formato: {plataforma}/{id_empresa}/recursos/{tipo_recurso}/{fecha}/{archivo}
 */
const generateS3Key = (idEmpresa, tipoRecurso, filename) => {
  const now = new Date();
  const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const tipoFolder = normalizeFolderName(tipoRecurso || 'otros');
  return `${PLATFORM_FOLDER}/${idEmpresa}/recursos/${tipoFolder}/${fecha}/${filename}`;
};

/**
 * Genera la ruta del archivo de audio de llamada en S3
 * Formato: {plataforma}/llamadas/{id_empresa}/{fecha}/{archivo}
 */
const generateLlamadaAudioKey = (idEmpresa, filename) => {
  const now = new Date();
  const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${PLATFORM_FOLDER}/llamadas/${idEmpresa}/${fecha}/${filename}`;
};

/**
 * Sube un archivo de audio de llamada a S3
 * @param {Buffer} fileBuffer - El buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} mimetype - Tipo MIME del archivo
 * @param {number|string} idEmpresa - ID de la empresa
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadLlamadaAudio = async (fileBuffer, filename, mimetype, idEmpresa) => {
  try {
    const key = generateLlamadaAudioKey(idEmpresa, filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype
    });

    await s3Client.send(command);

    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    logger.info(`[s3.service] Audio de llamada subido exitosamente: ${key}`);

    return { url, key };
  } catch (error) {
    logger.error(`[s3.service] Error al subir audio de llamada: ${error.message}`);
    throw error;
  }
};

/**
 * Sube un archivo a S3
 * @param {Buffer} fileBuffer - El buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} mimetype - Tipo MIME del archivo
 * @param {number|string} idEmpresa - ID de la empresa
 * @param {string} tipoRecurso - Tipo de recurso (para organizar en carpetas)
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadFile = async (fileBuffer, filename, mimetype, idEmpresa, tipoRecurso = 'otros') => {
  try {
    const key = generateS3Key(idEmpresa, tipoRecurso, filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype
    });

    await s3Client.send(command);

    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    logger.info(`[s3.service] Archivo subido exitosamente: ${key}`);

    return { url, key };
  } catch (error) {
    logger.error(`[s3.service] Error al subir archivo: ${error.message}`);
    throw error;
  }
};

/**
 * Elimina un archivo de S3
 * @param {string} key - La key del archivo en S3
 */
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key
    });

    await s3Client.send(command);
    logger.info(`[s3.service] Archivo eliminado exitosamente: ${key}`);
  } catch (error) {
    logger.error(`[s3.service] Error al eliminar archivo: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  generateS3Key,
  uploadLlamadaAudio,
  generateLlamadaAudioKey
};
