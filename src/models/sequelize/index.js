const { sequelize, testConnection } = require('../../config/database');
const { Sequelize } = require('sequelize');

const db = {};

// Cargar modelos - Fase 1: Sin dependencias (tablas base)
db.Empresa = require('./empresa.model')(sequelize);
db.Rol = require('./rol.model')(sequelize);
db.Modulo = require('./modulo.model')(sequelize);
db.Formato = require('./formato.model')(sequelize);
db.FormatoCampo = require('./formatoCampo.model')(sequelize);
db.CampoSistema = require('./campoSistema.model')(sequelize);
db.FormatoCampoPlantilla = require('./formatoCampoPlantilla.model')(sequelize);
db.Speaker = require('./speaker.model')(sequelize);
db.Voz = require('./voz.model')(sequelize);
db.Tool = require('./tool.model')(sequelize);
db.EstadoLlamada = require('./estadoLlamada.model')(sequelize);
db.TipoRecurso = require('./tipoRecurso.model')(sequelize);
db.Distrito = require('./distrito.model')(sequelize);
db.DistritoAdyacente = require('./distritoAdyacente.model')(sequelize);
db.TablaGqmLead = require('./tablaGqmLead.model')(sequelize);

// Cargar modelos - Fase 2: Dependencias de Empresa
db.TipoCampania = require('./tipoCampania.model')(sequelize);
db.EstadoCampania = require('./estadoCampania.model')(sequelize);
db.Marca = require('./marca.model')(sequelize);
db.Sucursal = require('./sucursal.model')(sequelize);
db.EstadoCita = require('./estadoCita.model')(sequelize);
db.EstadoProspecto = require('./estadoProspecto.model')(sequelize);
db.Campania = require('./campania.model')(sequelize);
db.CampaniaEjecucion = require('./campaniaEjecucion.model')(sequelize);
db.ConfiguracionLlamada = require('./configuracionLlamada.model')(sequelize);
db.PeriodicidadRecordatorio = require('./periodicidadRecordatorio.model')(sequelize);
db.Faq = require('./faq.model')(sequelize);
db.Plantilla = require('./plantilla.model')(sequelize);
db.PlantillaWhatsapp = require('./plantillaWhatsapp.model')(sequelize);
db.PromptAsistente = require('./promptAsistente.model')(sequelize);

// Cargar modelos - Fase 3: Dependencias de Rol, Modulo
db.RolModulo = require('./rolModulo.model')(sequelize);

// Cargar modelos - Fase 4: Usuario y dependencias
db.Usuario = require('./usuario.model')(sequelize);

// Cargar modelos - Fase 4.1: Dependencias de Usuario
db.DiaDescanso = require('./diaDescanso.model')(sequelize);
db.HorarioAtencion = require('./horarioAtencion.model')(sequelize);
db.HorarioBloqueado = require('./horarioBloqueado.model')(sequelize);

// Cargar modelos - Fase 5: Dependencias de Proyecto, Tipologia
db.Recurso = require('./recurso.model')(sequelize);

//Cargar modelos - Fase 5.1: Dependencias de Marca
db.Modelo = require('./modelo.model')(sequelize);
db.Version = require('./version.model')(sequelize);

// Cargar modelos - Fase 6: Tipificacion (depende de Empresa)
db.Tipificacion = require('./tipificacion.model')(sequelize);

// Cargar modelos - Fase 7: Prospecto
db.Prospecto = require('./prospecto.model')(sequelize);

// Cargar modelos - Fase 8: Chat y Mensaje
db.Chat = require('./chat.model')(sequelize);
db.Mensaje = require('./mensaje.model')(sequelize);
db.MensajeVisto = require('./mensajeVistoUsuario.model')(sequelize);

// Cargar modelos - Fase 9: Cita y dependencias
db.Cita = require('./cita.model')(sequelize);

// Cargar modelos - Fase 10: Llamada y Transcripcion
db.Llamada = require('./llamada.model')(sequelize);
db.Transcripcion = require('./transcripcion.model')(sequelize);

// Cargar modelos - Fase 10.1: Speech Analytics (depende de Llamada y Empresa)
db.AnalisisLlamada = require('./analisisLlamada.model')(sequelize);
db.AnalisisSentimiento = require('./analisisSentimiento.model')(sequelize);
db.PreguntaFrecuente = require('./preguntaFrecuente.model')(sequelize);

// Cargar modelos - Fase 11: Interaccion
db.Interaccion = require('./interaccion.model')(sequelize);

// Cargar modelos - Fase 12: Tablas de relacion
db.CampaniaProspectos = require('./campaniaProspectos.model')(sequelize);
db.ProspectoRecordatorio = require('./prospectoRecordatorio.model')(sequelize);

// Cargar modelos - Fase 13: Configuracion WhatsApp
db.ConfiguracionWhatsapp = require('./configuracionWhatsapp.model')(sequelize);

// Cargar modelos - Fase 14: Envios Masivos WhatsApp
db.EnvioMasivoWhatsapp = require('./envioMasivoWhatsapp.model')(sequelize);
db.EnviosProspectos = require('./enviosProspectos.model')(sequelize);

// Ejecutar asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Exportar instancia de Sequelize y modelos
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.testConnection = testConnection;

module.exports = db;
