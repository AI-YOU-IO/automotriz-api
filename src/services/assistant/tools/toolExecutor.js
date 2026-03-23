const faqVectorService = require("../../faq/faqVector.service");
const ProspectoRepository = require("../../../repositories/prospecto.repository");
const CitaRepository = require("../../../repositories/cita.repository");
const DiaDescansoRepository = require("../../../repositories/diaDescanso.repository");
const InteraccionRepository = require("../../../repositories/interaccion.repository");
const HorarioAtencionRepository = require("../../../repositories/horarioAtencion.repository");
const SperantServices = require("../../sperant/sperant.service");
const UltravoxService = require("../../ultravox/ultravox.service");
const logger = require("../../../config/logger/loggerClient");

class ToolExecutor {

    constructor({ id_empresa, prospecto_id }) {
        this.id_empresa = id_empresa;
        this.prospecto_id = prospecto_id;
    }

    async execute(toolName, args) {
        switch (toolName) {
            case "obtenerLead":
                return this._obtenerLead(args);
            case "obtenerPuntaje":
                return this._obtenerPuntaje(args);
            case "crearNuevoLead":
                return this._crearNuevoLead(args);
            case "actualizarLead":
                return this._actualizarLead(args);
            case "obtenerUnidades":
                return this._obtenerUnidades(args);
            case "obtenerUnidad":
                return this._obtenerUnidad(args);
            case "crearCita":
                return this._crearCita(args);
            case "obtenerCita":
                return this._obtenerCita(args);
            case "obtenerHorarioAtencion":
                return this._obtenerHorarioAtencion();
            case "obtenerDiasDescanso":
                return this._obtenerDiasDescanso(args);
            case "obtenerHorariosOcupados":
                return this._obtenerHorariosOcupados(args);
            case "crearInteracciones":
                return this._crearInteracciones(args);
            case "enviarLeadLlamada":
                return this._enviarLeadLlamada(args);
            case "obtenerUnidadesPorDormitorio":
                return this._obtenerUnidadesPorDormitorio(args);
            case "buscarFaqs":
                return this._buscarFaqs(args);

            default:
                logger.warn(`[ToolExecutor] Tool desconocido: ${toolName}`);
                return JSON.stringify({ error: `Tool desconocido: ${toolName}` });
        }
    }

    // ---- Tools de negocio ----

    async _obtenerLead({ id }) {
        logger.info(`[ToolExecutor] obtenerLead: id=${id}`);
        const lead = await ProspectoRepository.findById(id);
        if (!lead) return JSON.stringify({ error: "Lead no encontrado" });
        return JSON.stringify(lead);
    }
    async _obtenerPuntaje({ id }) {
        logger.info(`[ToolExecutor] obtenerPuntaje: id=${id}`);
        const result = await SperantServices.obtenerPuntaje(id);
        if (!result) return JSON.stringify({ status: 500, error: "Error de conexión con Sperant" });
        if (result.status >= 400) return JSON.stringify({ status: result.status, error: result.data, mensaje: "La API de Sperant rechazó la solicitud. Revisa los campos enviados, corrige los valores incorrectos y vuelve a intentar." });
        return JSON.stringify({ status: result.status, data: result.data });
    }

    async _crearNuevoLead({ nombre_completo, dni, celular, direccion }) {
        logger.info(`[ToolExecutor] crearNuevoLead: ${nombre_completo}`);
        const lead = await ProspectoRepository.create({
            nombre_completo,
            dni,
            celular,
            direccion,
            id_empresa: this.id_empresa,
            id_estado_prospecto: 1
        });
        return JSON.stringify(lead);
    }

    async _actualizarLead({ id, ...datos }) {
        logger.info(`[ToolExecutor] actualizarLead: id=${id}`);
        await ProspectoRepository.update(id, datos);
        const lead = await ProspectoRepository.findById(id);
        return JSON.stringify(lead);
    }

    async _obtenerProyectosDisponibles({ distrito }) {
        logger.info(`[ToolExecutor] obtenerProyectosDisponibles: distrito=${distrito}`);
        const proyectos = await ProyectoRepository.findByDistrito(distrito);
        return JSON.stringify(proyectos);
    }

    async _buscarProyectoPorNombre({ nombre, distrito }) {
        logger.info(`[ToolExecutor] buscarProyectoPorNombre: nombre=${nombre}, distrito=${distrito}`);
        const proyectos = await ProyectoRepository.findByNombre(nombre, distrito || null);
        return JSON.stringify(proyectos);
    }

    async _obtenerProyecto({ id }) {
        logger.info(`[ToolExecutor] obtenerProyecto: id=${id}`);
        const proyecto = await ProyectoRepository.findById(id);
        if (!proyecto) return JSON.stringify({ error: "Proyecto no encontrado" });
        return JSON.stringify(proyecto);
    }

    async _obtenerUnidades({ id_proyecto }) {
        logger.info(`[ToolExecutor] obtenerUnidades: id_proyecto=${id_proyecto}`);
        const unidades = await UnidadRepository.findByProyecto(id_proyecto);
        return JSON.stringify(unidades);
    }

    async _obtenerUnidadesPorDormitorio({ numeroDormitorios, id_proyecto }) {
        logger.info(`[ToolExecutor] obtenerUnidadesPorDormitorio: numeroDormitorio=${numeroDormitorios}`);
        const unidades = await UnidadRepository.findByDormitorios(id_proyecto, numeroDormitorios);
        return JSON.stringify(unidades);
    }

    async _obtenerUnidad({ id }) {
        logger.info(`[ToolExecutor] obtenerUnidad: id=${id}`);
        const unidad = await UnidadRepository.findById(id);
        if (!unidad) return JSON.stringify({ error: "Unidad no encontrada" });
        return JSON.stringify(unidad);
    }

    async _crearCita({ nombre, hora_inicio, hora_fin, lugar, id_prospecto, id_proyecto, id_unidad }) {
        logger.info(`[ToolExecutor] crearCita: ${nombre}`);
        const cita = await CitaRepository.create({
            nombre,
            hora_inicio,
            hora_fin,
            lugar,
            id_prospecto,
            id_proyecto,
            id_unidad,
            id_estado_cita: 1,
            id_usuario: 1
        });
        return JSON.stringify(cita);
    }

    async _obtenerCita({ id_prospecto }) {
        logger.info(`[ToolExecutor] obtenerCita: id_prospecto=${id_prospecto}`);
        const citas = await CitaRepository.findByProspecto(id_prospecto);
        return JSON.stringify(citas);
    }

    async _obtenerHorarioAtencion() {
        logger.info(`[ToolExecutor] obtenerHorarioAtencion: id_empresa=${this.id_empresa}`);
        const horario = await HorarioAtencionRepository.findByEmpresa(this.id_empresa);
        return JSON.stringify(horario);
    }

    async _obtenerDiasDescanso({ id_usuario, fecha_descanso }) {
        logger.info(`[ToolExecutor] obtenerDiasDescanso: id_usuario=${id_usuario}, fecha_descanso=${fecha_descanso}`);
        const dias = await DiaDescansoRepository.findByUsuarioAndDay(id_usuario, fecha_descanso);
        return JSON.stringify(dias);
    }

    async _obtenerHorariosOcupados({ id_usuario }) {
        logger.info(`[ToolExecutor] obtenerHorariosOcupados: id_usuario=${id_usuario}`);
        const horarios = await CitaRepository.findHorariosOcupados(id_usuario);
        return JSON.stringify(horarios);
    }

    async _crearCitaSperant({ name, datetime_start, duration, place, description, client_id, project_id, unit_id, event_type_id = 10, creator_id }) {
        logger.info(`[ToolExecutor] crearCitaSperant: ${name}`);
        const result = await SperantServices.crearCitaSperant({
            name,
            datetime_start,
            duration,
            place,
            description,
            client_id,
            project_id,
            unit_id,
            event_type_id,
            creator_id
        });
        if (!result) return JSON.stringify({ status: 500, error: "Error de conexión con Sperant" });
        if (result.status >= 400) return JSON.stringify({ status: result.status, error: result.data, mensaje: "La API de Sperant rechazó la solicitud. Revisa los campos enviados, corrige los valores incorrectos y vuelve a intentar." });
        return JSON.stringify({ status: result.status, data: result.data });
    }

    async _crearInteraccionesSperant({ id, ...data }) {
        logger.info(`[ToolExecutor] crearInteraccionesSperant: id=${id}`);
        const result = await SperantServices.crearInteraccionSperant(id, data);
        if (!result) return JSON.stringify({ status: 500, error: "Error de conexión con Sperant" });
        if (result.status >= 400) return JSON.stringify({ status: result.status, error: result.data, mensaje: "La API de Sperant rechazó la solicitud. Revisa los campos enviados, corrige los valores incorrectos y vuelve a intentar." });
        return JSON.stringify({ status: result.status, data: result.data });
    }

    async _crearInteracciones({ id_prospecto, ...datos }) {
        logger.info(`[ToolExecutor] crearInteracciones: datos=${JSON.stringify(datos)}`);
        const interaccion = await InteraccionRepository.create({
            id_prospecto,
            ...datos,
            id_empresa: this.id_empresa
        });
        return JSON.stringify(interaccion);
    }

    async _enviarLeadLlamada({ destination, data, extras }) {
        logger.info(`[ToolExecutor] enviarLeadLlamada: destination=${destination}`);
        const resultado = await UltravoxService.realizarLlamada({
            destination,
            data,
            extras
        });
        if (!resultado) return JSON.stringify({ error: "Error al enviar lead a llamada" });
        return JSON.stringify(resultado);
    }

    async _buscarFaqs({ query }) {
        logger.info(`[ToolExecutor] buscarFaqs: query="${query}"`);
        const results = await faqVectorService.search(query, this.id_empresa, 2);
        const filtered = results.filter(r => parseFloat(r.similarity) >= 0.35);
        if (filtered.length === 0) return JSON.stringify({ resultado: "No se encontraron FAQs relevantes para esta consulta" });
        return JSON.stringify(filtered.map(r => ({ pregunta: r.pregunta, respuesta: r.respuesta })));
    }

    async _crearClienteSperant(datos) {
        logger.info(`[ToolExecutor] crearClienteSperant: datos=${JSON.stringify(datos)}`);
        const result = await SperantServices.crearClienteSperant(datos);
        if (!result) return JSON.stringify({ status: 500, error: "Error de conexión con Sperant" });
        if (result.status >= 400) return JSON.stringify({ status: result.status, error: result.data, mensaje: "La API de Sperant rechazó la solicitud. Revisa los campos enviados, corrige los valores incorrectos y vuelve a intentar." });
        return JSON.stringify({ status: result.status, data: result.data });
    }
}

module.exports = ToolExecutor;
