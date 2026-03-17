const toolDefinitions = [
    {
        type: "function",
        function: {
            name: "obtenerLead",
            description: "Obtiene la informacion del lead según el id",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Id del lead o cliente"
                    }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "crearNuevoLead",
            description: "Te permite crear un nuevo lead para el sistema",
            parameters: {
                type: "object",
                properties: {
                    nombre_completo: {
                        type: "string",
                        description: "Nombre completo del nuevo lead"
                    },
                    dni: {
                        type: "string",
                        description: "DNI del nuevo lead"
                    },
                    celular: {
                        type: "string",
                        description: "Numero celular del nuevo lead"
                    },
                    direccion: {
                        type: "string",
                        description: "Direccion del nuevo lead"
                    }
                },
                required: ["nombre_completo", "celular"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "crearClienteSperant",
            description: "Te permite crear un nuevo cliente en el CRM Sperant para obt",
            parameters: {
                type: "object",
                properties: {
                    fname: {
                        type: "string",
                        description: "Nombres del cliente a crear"
                    },
                    lname: {
                        type: "string",
                        description: "Apellidos del cliente a crear"
                    },
                    phone: {
                        type: "string",
                        description: "Numero celular del nuevo cliente"
                    },
                    document_type_id: {
                        type: "integer",
                        description: "ID de tipo de documento. Valor por defecto es 1",
                    },
                    document: {
                        type: "string",
                        description: "DNI del cliente a crear"
                    },
                    project_id: {
                        type: "integer",
                        description: "sperant_id del proyecto que el cliente seleccionó",
                    },
                    interest_type_id: {
                        type: "integer",
                        description: "ID tipo de interes. Valor por defecto es 1",
                    },
                    input_channel_id: {
                        type: "integer",
                        description: "ID de canal de entrada. Valor por defecto es 1",
                    },
                    source_id: {
                        type: "integer",
                        description: "ID de fuente. Valor por defecto es 1",
                    },
                    extra_fields: {
                        type: "object",
                        properties: {
                            perfilamiento: {
                                type: "boolean",
                                description: "True o false si el prospecto acepta el perfilamiento"
                            }
                        },
                        required: ["perfilamiento"]
                    }
                },
                required: ["fname", "document_type_id", "document", "project_id", "interest_type_id", "input_channel_id", "source_id", "extra_fields"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerPuntaje",
            description: "Obtiene la informacion del cliente en Sperant para registar el puntaje",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "sperant_id del prospecto"
                    }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "actualizarLead",
            description: "Te permite actualizar la informacion del lead para el sistema",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Id del lead a actualizar"
                    },
                    nombre_completo: {
                        type: "string",
                        description: "Nombre completo del nuevo lead"
                    },
                    dni: {
                        type: "string",
                        description: "DNI del nuevo lead"
                    },
                    celular: {
                        type: "string",
                        description: "Numero celular del nuevo lead"
                    },
                    direccion: {
                        type: "string",
                        description: "Direccion del nuevo lead"
                    },
                    perfilamiento: {
                        type: "integer",
                        description: "Estado del perfilamiento 0 o 1"
                    },
                    puntaje: {
                        type: "integer",
                        description: "Puntaje acrediticion"
                    },
                    id_estado_prospecto: {
                        type: "integer",
                        description: "Estado del prospecto"
                    },
                    sperant_id: {
                        type: "integer",
                        description: "ID del cliente registrado en el CRM Sperant"
                    },
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerProyectosDisponibles",
            description: "Obtiene una lista de proyectos disponibles por el distrito",
            parameters: {
                type: "object",
                properties: {
                    distrito: {
                        type: "string",
                        description: "Distrito para filtrar los proyectos"
                    }
                },
                required: ["distrito"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "buscarProyectoPorNombre",
            description: "Busca proyectos disponibles por nombre del proyecto. Opcionalmente filtra por distrito.",
            parameters: {
                type: "object",
                properties: {
                    nombre: {
                        type: "string",
                        description: "Nombre o parte del nombre del proyecto a buscar"
                    },
                    distrito: {
                        type: "string",
                        description: "Nombre del distrito para filtrar los proyectos (opcional)"
                    }
                },
                required: ["nombre"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerProyecto",
            description: "Obtiene la informacion del proyecto según el id",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Id del proyecto seleccionado"
                    }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerUnidades",
            description: "Obtiene la lista de unidades según el id del proyecto",
            parameters: {
                type: "object",
                properties: {
                    id_proyecto: {
                        type: "integer",
                        description: "ID del proyecto seleccionado"
                    }
                },
                required: ["id_proyecto"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerUnidadesPorDormitorio",
            description: "Obtiene la lista de unidades filtrado por la cantidad de dormitorios",
            parameters: {
                type: "object",
                properties: {
                    numeroDormitorios: {
                        type: "integer",
                        description: "Cantidad de dormitorios a buscar"
                    },
                     id_proyecto: {
                        type: "integer",
                        description: "ID del proyecto seleccionado"
                    }
                },
                required: ["numeroDormitorios", "id_proyecto"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerUnidad",
            description: "Obtiene el detalle de la unidades seleccionada",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Id del unidad seleccionado"
                    }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "crearCita",
            description: "Crea la cita para el cliente o lead",
            parameters: {
                type: "object",
                properties: {
                    nombre: {
                        type: "string",
                        description: "Nombre de la cita"
                    },
                    hora_inicio: {
                        type: "string",
                        description: "Timestamp para el inicio de la cita"
                    },
                    hora_fin: {
                        type: "string",
                        description: "Timestamp para el fin de la cita"
                    },
                    lugar: {
                        type: "string",
                        description: "Lugar donde se realizará la cita"
                    },
                    id_estado_cita: {
                        type: "integer",
                        description: "ID del estado de la cita. Valor por defecto es 1",
                    },
                    id_prospecto: {
                        type: "integer",
                        description: "ID del lead o prospecto"
                    },
                    id_proyecto: {
                        type: "integer",
                        description: "ID del proyecto seleccionado"
                    },
                    id_unidad: {
                        type: "integer",
                        description: "ID de la unidad seleccionada"
                    }
                },
                required: ["nombre", "hora_inicio", "hora_fin", "lugar", "id_prospecto", "id_proyecto", "id_unidad"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "crearCitaSperant",
            description: "Crea la cita para el cliente o lead en el CRM Sperant",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Nombre de la cita"
                    },
                    datetime_start: {
                        type: "integer",
                        description: "Timestamp para el inicio de la cita en valor numerico"
                    },
                    duration: {
                        type: "integer",
                        description: "Duración en horas de la cita"
                    },
                    place: {
                        type: "string",
                        description: "Lugar donde se realizará la cita"
                    },
                    description: {
                        type: "string",
                        description: "Descripcion sobre la cita"
                    },
                    client_id: {
                        type: "integer",
                        description: "sperant_id del lead o prospecto"
                    },
                    project_id: {
                        type: "integer",
                        description: "sperant_id del proyecto seleccionado"
                    },
                    unit_id: {
                        type: "integer",
                        description: "sperant_id de la unidad seleccionada"
                    },
                    event_type_id: {
                        type: "integer",
                        description: "ID de tipo de evento. Valor por defecto es 10",
                    },
                    creator_id: {
                        type: "integer",
                        description: "ID del usuario asignado al lead o prospecto"
                    }
                },
                required: ["name", "datetime_start", "duration", "client_id", "project_id", "unit_id", "event_type_id", "creator_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerCita",
            description: "Obtiene las citas agendadas del lead",
            parameters: {
                type: "object",
                properties: {
                    id_prospecto: {
                        type: "integer",
                        description: "ID del lead o prospecto"
                    }
                },
                required: ["id_prospecto"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerHorarioAtencion",
            description: "Obtiene los días de atención presencial. Devuelve los días de la semana y las horas de atención (0=domingo, 1=lunes ... 6=sábado)",
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerDiasDescanso",
            description: "Obtiene la fecha de descanso del asesor si coincide",
            parameters: {
                type: "object",
                properties: {
                    id_usuario: {
                        type: "integer",
                        description: "ID del asesor/usuario"
                    },
                    fecha_descanso: {
                        type: "string",
                        description: "Fecha consultada por el lead"
                    }
                },
                required: ["id_usuario", "fecha_descanso"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtenerHorariosOcupados",
            description: "Obtiene las citas ya agendadas del asesor, con hora_inicio y hora_fin, para saber qué horarios ya están ocupados",
            parameters: {
                type: "object",
                properties: {
                    id_usuario: {
                        type: "integer",
                        description: "ID del asesor/usuario"
                    }
                },
                required: ["id_usuario"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "crearInteraccionesSperant",
            description: "Crea una nueva interacción en el CRM Sperant",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "sperant_id del lead o prospecto"
                    },
                    project_id: {
                        type: "integer",
                        description: "sperant_id del proyecto seleccionado"
                    },
                    agent_id: {
                        type: "integer",
                        description: "sperant_id del asesor asignado al lead o prospecto"
                    },
                    unit_id: {
                        type: "integer",
                        description: "sperant_id de la unidad seleccionada"
                    },
                    satisfactory: {
                        type: "boolean",
                        description: "Indica si la interacción fue satisfactoria"
                    },
                    utm_content: {
                        type: "string",
                        description: "UTM Content"
                    },
                    utm_term: {
                        type: "string",
                        description: "UTM term"
                    },
                    utm_campaign: {
                        type: "string",
                        description: "UTM campaign"
                    },
                    utm_medium: {
                        type: "string",
                        description: "UTM medium"
                    },
                    utm_source: {
                        type: "string",
                        description: "UTM source"
                    },
                    observations: {
                        type: "string",
                        description: "Observación de la interacción. Aqui se registra las habitaciones de interes, presupuesto, descuento ofrecido y el resumen de la interaccion"
                    },
                    reason_resign_id: {
                        type: "integer",
                        description: "ID de desistimiento"
                    },
                    segment_code: {
                        type: "string",
                        description: "Codigo de segmento"
                    },
                    interest_type_id: {
                        type: "integer",
                        description: "ID tipo de interes. Valor por defecto es 1",
                    },
                    input_channel_id: {
                        type: "integer",
                        description: "ID de canal de entrada. Valor por defecto es 1",
                    },
                    source_id: {
                        type: "integer",
                        description: "ID de fuente. Valor por defecto es 1",
                    },
                    interaction_type_id: {
                        type: "integer",
                        description: "ID tipo de interaccion. Valor por defecto es 1",
                    },
                },
                required: ["project_id", "agent_id", "unit_id", "interest_type_id", "input_channel_id", "source_id", "interaction_type_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "crearInteracciones",
            description: "Crea una nueva interacción",
            parameters: {
                type: "object",
                properties: {
                    id_proyecto: {
                        type: "integer",
                        description: "sperant_id del proyecto seleccionado"
                    },
                    id_usuario: {
                        type: "integer",
                        description: "sperant_id del asesor asignado al lead o prospecto"
                    },
                    id_unidad: {
                        type: "integer",
                        description: "sperant_id de la unidad seleccionada"
                    },
                    satisfactorio: {
                        type: "integer",
                        description: "Indica si la interacción fue satisfactoria. Es 0 o 1"
                    },
                    utm_content: {
                        type: "string",
                        description: "UTM Content"
                    },
                    utm_term: {
                        type: "string",
                        description: "UTM term"
                    },
                    utm_campaign: {
                        type: "string",
                        description: "UTM campaign"
                    },
                    utm_medium: {
                        type: "string",
                        description: "UTM medium"
                    },
                    utm_source: {
                        type: "string",
                        description: "UTM source"
                    },
                    observaciones: {
                        type: "string",
                        description: "Observación de la interacción. Aqui se registra las habitaciones de interes, presupuesto, descuento ofrecido y el resumen de la interaccion"
                    },
                    id_motivo_desistimiento: {
                        type: "integer",
                        description: "ID de desistimiento"
                    },
                    id_prospecto: {
                        type: "integer",
                        description: "ID del lead o prospecto"
                    },
                    id_nivel_interes: {
                        type: "integer",
                        description: "ID tipo de interes. Valor por defecto es 1",
                    },
                    id_canal_entrada: {
                        type: "integer",
                        description: "ID de canal de entrada. Valor por defecto es 1",
                    },
                    id_medio_captacion: {
                        type: "integer",
                        description: "ID de fuente. Valor por defecto es 1",
                    },
                    id_tipo_interaccion: {
                        type: "integer",
                        description: "ID tipo de interaccion. Valor por defecto es 1",
                    },
                },
                required: ["id_proyecto", "id_usuario", "id_unidad", "id_prospecto", "id_nivel_interes", "id_canal_entrada", "id_medio_captacion", "id_tipo_interaccion"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "buscarFaqs",
            description: "Busca en la base de conocimiento las preguntas frecuentes y objeciones más relevantes para responder la consulta del cliente. Úsala siempre que el cliente haga una pregunta o exprese una objeción antes de responder.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "La pregunta u objeción del cliente, en sus propias palabras"
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "enviarLeadLlamada",
            description: "Envias la informacion del lead o prospecto para continuar el flujo con nuestro agente de llamadas",
            parameters: {
                type: "object",
                properties: {
                    destination: {
                        type: "string",
                        description: "Número del lead o prospecto donde recibirá la llamada"
                    },
                    data: {
                        type: "object",
                        description: "Objecto que contiene información del lead o prospecto incluyendo fase del flujo"
                    },
                    extras: {
                        type: "object",
                        description: "Contenido extra para la llamada",
                        properties: {
                            voice: {
                                type: "string",
                                description: "ID o nombre de la voz a utilizar por el agente de llamada",
                                default: "bacfa559-a200-4377-9d0e-fcae7c766a1f",
                            },
                            empresa: {
                                type: "object",
                                description: "Datos de la empresa",
                                properties: {
                                    id: {
                                        type: "integer",
                                        description: "Id de la empresa donde el lead o prospecto pertenece"
                                    },
                                    nombre: {
                                        type: "string",
                                        description: "Nombre de la empresa",
                                        default: "viva"
                                    }
                                },
                                required: ["nombre"]
                            }
                        },
                        required: ["voice", "empresa"]
                    }
                },
                required: ["destination", "data", "extras"]
            }
        }
    }
];

module.exports = { toolDefinitions };
