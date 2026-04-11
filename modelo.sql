-- public.distrito definition

-- Drop table

-- DROP TABLE public.distrito;

CREATE TABLE public.distrito (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT distrito_pkey PRIMARY KEY (id)
);


-- public.empresa definition

-- Drop table

-- DROP TABLE public.empresa;

CREATE TABLE public.empresa (
	id serial4 NOT NULL,
	razon_social varchar(70) NOT NULL,
	nombre_comercial varchar(70) NOT NULL,
	ruc varchar(20) NOT NULL,
	email varchar(50) NOT NULL,
	telefono int4 NULL,
	direccion varchar(60) NULL,
	logo_url varchar(100) NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_tool int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	id_tool_chatbot int4 NULL,
	canal int4 DEFAULT 0 NOT NULL,
	CONSTRAINT empresa_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trg_empresa_fecha_actualizacion before
update
    on
    public.empresa for each row execute function fn_update_fecha_actualizacion();


-- public.estado_campania definition

-- Drop table

-- DROP TABLE public.estado_campania;

CREATE TABLE public.estado_campania (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	color varchar(20) NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	fecha_actualizacion timestamp DEFAULT now() NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT estado_campania_pkey PRIMARY KEY (id)
);


-- public.formato definition

-- Drop table

-- DROP TABLE public.formato;

CREATE TABLE public.formato (
	id int4 DEFAULT nextval('tipo_plantilla_id_seq'::regclass) NOT NULL,
	nombre varchar(100) NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT tipo_plantilla_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trg_tipo_plantilla_fecha_actualizacion before
update
    on
    public.formato for each row execute function fn_update_fecha_actualizacion();


-- public.speaker definition

-- Drop table

-- DROP TABLE public.speaker;

CREATE TABLE public.speaker (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT speaker_pkey PRIMARY KEY (id)
);


-- public.tipo_campania definition

-- Drop table

-- DROP TABLE public.tipo_campania;

CREATE TABLE public.tipo_campania (
	id serial4 NOT NULL,
	nombre varchar(50) NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT tipo_campania_pkey PRIMARY KEY (id)
);


-- public.tipo_recurso definition

-- Drop table

-- DROP TABLE public.tipo_recurso;

CREATE TABLE public.tipo_recurso (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT tipo_recurso_pkey PRIMARY KEY (id)
);


-- public.tool definition

-- Drop table

-- DROP TABLE public.tool;

CREATE TABLE public.tool (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	nombre varchar(100) NOT NULL,
	descripcion text NULL,
	ruta varchar(255) NOT NULL,
	estado_registro int4 DEFAULT 1 NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	tipo varchar(100) NULL,
	CONSTRAINT tool_pkey PRIMARY KEY (id),
	CONSTRAINT uk_tool_nombre UNIQUE (nombre),
	CONSTRAINT uk_tool_ruta UNIQUE (ruta)
);


-- public.voz definition

-- Drop table

-- DROP TABLE public.voz;

CREATE TABLE public.voz (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	nacionalidad varchar(100) NOT NULL,
	genero public.genero_voz NOT NULL,
	voice_code varchar(100) NOT NULL,
	estado_registro int4 DEFAULT 1 NULL,
	usuario_registro varchar(100) NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	usuario_actualizacion varchar(100) NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT uq_voice_code UNIQUE (voice_code),
	CONSTRAINT voz_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_voz_estado ON public.voz USING btree (estado_registro);
CREATE INDEX idx_voz_genero ON public.voz USING btree (genero);
CREATE INDEX idx_voz_nacionalidad ON public.voz USING btree (nacionalidad);


-- public.chatbot_config definition

-- Drop table

-- DROP TABLE public.chatbot_config;

CREATE TABLE public.chatbot_config (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	nombre_bot varchar(50) NOT NULL,
	personalidad varchar(255) NULL,
	mensaje_bienvenida text NULL,
	prompt_sistema text NOT NULL,
	tools jsonb DEFAULT '[]'::jsonb NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	usuario_actualizacion int4 NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	fecha_actualizacion timestamp DEFAULT now() NULL,
	CONSTRAINT chatbot_config_pkey PRIMARY KEY (id),
	CONSTRAINT chatbot_config_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);
CREATE UNIQUE INDEX idx_chatbot_config_empresa_activo ON public.chatbot_config USING btree (id_empresa) WHERE (estado_registro = 1);


-- public.configuracion_whatsapp definition

-- Drop table

-- DROP TABLE public.configuracion_whatsapp;

CREATE TABLE public.configuracion_whatsapp (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	app_id varchar(100) NULL,
	numero_telefono_id varchar(100) NULL,
	clave_secreta varchar(255) NULL,
	token_whatsapp varchar(500) NULL,
	waba_id varchar(100) NULL,
	phone_number varchar(50) NULL,
	token_expiration varchar(100) NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_registro int4 NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_actualizacion int4 NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	envios_masivos int4 DEFAULT 0 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT configuracion_whatsapp_pk PRIMARY KEY (id),
	CONSTRAINT configuracion_whatsapp_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);


-- public.credencial_api definition

-- Drop table

-- DROP TABLE public.credencial_api;

CREATE TABLE public.credencial_api (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	servicio varchar NULL,
	api_url varchar NULL,
	api_token varchar NULL,
	descripcion varchar NULL,
	fecha_expiracion timestamp NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_registro int4 NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_actualizacion int4 NULL,
	estado_registro int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT credencial_api_pk PRIMARY KEY (id),
	CONSTRAINT credencial_api_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);


-- public.distrito_adyacente definition

-- Drop table

-- DROP TABLE public.distrito_adyacente;

CREATE TABLE public.distrito_adyacente (
	id int4 DEFAULT nextval('distritos_adyacentes_id_seq'::regclass) NOT NULL,
	id_adyacente int4 NOT NULL,
	id_distrito int4 NOT NULL,
	prioridad int4 DEFAULT 0 NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT distritos_adyacentes_pkey PRIMARY KEY (id),
	CONSTRAINT distritos_adyacentes_id_distrito_fkey FOREIGN KEY (id_distrito) REFERENCES public.distrito(id)
);


-- public.estado_cita definition

-- Drop table

-- DROP TABLE public.estado_cita;

CREATE TABLE public.estado_cita (
	id serial4 NOT NULL,
	nombre varchar(60) NOT NULL,
	color varchar(30) NOT NULL,
	orden int4 DEFAULT 0 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT estado_cita_pkey PRIMARY KEY (id),
	CONSTRAINT estado_cita_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_estado_cita_fecha_actualizacion before
update
    on
    public.estado_cita for each row execute function fn_update_fecha_actualizacion();


-- public.estado_llamada definition

-- Drop table

-- DROP TABLE public.estado_llamada;

CREATE TABLE public.estado_llamada (
	id serial4 NOT NULL,
	nombre varchar(50) NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT estado_llamada_pkey PRIMARY KEY (id),
	CONSTRAINT estado_llamada_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_estado_llamada_fecha_actualizacion before
update
    on
    public.estado_llamada for each row execute function fn_update_fecha_actualizacion();


-- public.estado_prospecto definition

-- Drop table

-- DROP TABLE public.estado_prospecto;

CREATE TABLE public.estado_prospecto (
	id serial4 NOT NULL,
	nombre varchar(50) NOT NULL,
	descripcion varchar(255) NULL,
	color varchar(500) NULL,
	orden int4 DEFAULT 0 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT estado_prospecto_pkey PRIMARY KEY (id),
	CONSTRAINT estado_prospecto_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_estado_prospecto_fecha_actualizacion before
update
    on
    public.estado_prospecto for each row execute function fn_update_fecha_actualizacion();


-- public.formato_campo definition

-- Drop table

-- DROP TABLE public.formato_campo;

CREATE TABLE public.formato_campo (
	id serial4 NOT NULL,
	id_formato int4 NOT NULL,
	nombre_campo varchar(100) NOT NULL,
	etiqueta varchar(100) NULL,
	tipo_dato varchar(20) DEFAULT 'string'::character varying NOT NULL,
	longitud int4 NULL,
	requerido int4 DEFAULT 0 NULL,
	unico int4 DEFAULT 0 NULL,
	orden int4 DEFAULT 1 NULL,
	placeholder varchar(200) NULL,
	estado_registro int4 DEFAULT 1 NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	fecha_actualizacion timestamp DEFAULT now() NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT formato_campo_pkey PRIMARY KEY (id),
	CONSTRAINT formato_campo_id_formato_fkey FOREIGN KEY (id_formato) REFERENCES public.formato(id) ON DELETE CASCADE
);


-- public.horario_atencion definition

-- Drop table

-- DROP TABLE public.horario_atencion;

CREATE TABLE public.horario_atencion (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	dia_semana int4 NOT NULL,
	hora_inicio time DEFAULT '09:00:00'::time without time zone NOT NULL,
	hora_fin time DEFAULT '18:00:00'::time without time zone NOT NULL,
	activo int4 DEFAULT 1 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT horario_atencion_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6))),
	CONSTRAINT horario_atencion_id_empresa_dia_semana_key UNIQUE (id_empresa, dia_semana),
	CONSTRAINT horario_atencion_pkey PRIMARY KEY (id),
	CONSTRAINT horario_atencion_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);


-- public.horario_bloqueado definition

-- Drop table

-- DROP TABLE public.horario_bloqueado;

CREATE TABLE public.horario_bloqueado (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	horario_lunes jsonb NULL,
	horario_martes jsonb NULL,
	horario_miercoles jsonb NULL,
	horario_jueves jsonb NULL,
	horario_viernes jsonb NULL,
	horario_sabado jsonb NULL,
	horario_domingo jsonb NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	usuario_actualizacion int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT horario_bloqueado_pkey PRIMARY KEY (id),
	CONSTRAINT horario_bloqueado_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);


-- public.marca definition

-- Drop table

-- DROP TABLE public.marca;

CREATE TABLE public.marca (
	id serial4 NOT NULL,
	nombre varchar(60) NOT NULL,
	descripcion varchar(255) NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT proyecto_pkey PRIMARY KEY (id),
	CONSTRAINT proyecto_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);
CREATE INDEX idx_proyecto_empresa ON public.marca USING btree (id_empresa);

-- Table Triggers

create trigger trg_proyecto_fecha_actualizacion before
update
    on
    public.marca for each row execute function fn_update_fecha_actualizacion();


-- public.modelo definition

-- Drop table

-- DROP TABLE public.modelo;

CREATE TABLE public.modelo (
	id serial4 NOT NULL,
	id_marca int4 NULL,
	nombre varchar(100) NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	descripcion text NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	id_recurso int4 NULL,
	CONSTRAINT modelo_pkey PRIMARY KEY (id),
	CONSTRAINT modelo_marca_fk FOREIGN KEY (id_marca) REFERENCES public.marca(id)
);
CREATE INDEX idx_modelo_marca ON public.modelo USING btree (id_marca);

-- Table Triggers

create trigger trg_modelo_fecha_actualizacion before
update
    on
    public.modelo for each row execute function fn_update_fecha_actualizacion();


-- public.periodicidad_recordatorio definition

-- Drop table

-- DROP TABLE public.periodicidad_recordatorio;

CREATE TABLE public.periodicidad_recordatorio (
	id serial4 NOT NULL,
	nombre varchar(70) NOT NULL,
	cada_horas int4 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT periodicidad_recordatorio_pkey PRIMARY KEY (id),
	CONSTRAINT periodicidad_recordatorio_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_periodicidad_recordatorio_fecha_actualizacion before
update
    on
    public.periodicidad_recordatorio for each row execute function fn_update_fecha_actualizacion();


-- public.plantilla definition

-- Drop table

-- DROP TABLE public.plantilla;

CREATE TABLE public.plantilla (
	id serial4 NOT NULL,
	nombre varchar(60) NOT NULL,
	descripcion varchar(60) NULL,
	prompt_sistema text NULL,
	prompt_inicio text NULL,
	prompt_flujo text NULL,
	prompt_cierre text NULL,
	prompt_resultado text NULL,
	id_formato int4 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT plantilla_pkey PRIMARY KEY (id),
	CONSTRAINT plantilla_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT plantilla_id_tipo_plantilla_fkey FOREIGN KEY (id_formato) REFERENCES public.formato(id)
);

-- Table Triggers

create trigger trg_plantilla_fecha_actualizacion before
update
    on
    public.plantilla for each row execute function fn_update_fecha_actualizacion();


-- public.plantilla_whatsapp definition

-- Drop table

-- DROP TABLE public.plantilla_whatsapp;

CREATE TABLE public.plantilla_whatsapp (
	id int4 DEFAULT nextval('whatsapp_plantilla_id_seq'::regclass) NOT NULL,
	"name" varchar(100) NOT NULL,
	status varchar(20) DEFAULT 'PENDING'::character varying NOT NULL,
	category varchar(20) DEFAULT 'MARKETING'::character varying NOT NULL,
	"language" varchar(10) DEFAULT 'es'::character varying NOT NULL,
	header_type varchar(20) NULL,
	header_text text NULL,
	body text NOT NULL,
	footer varchar(255) NULL,
	buttons text NULL,
	stats_enviados int4 DEFAULT 0 NULL,
	stats_entregados int4 DEFAULT 0 NULL,
	stats_leidos int4 DEFAULT 0 NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	fecha_actualizacion timestamp DEFAULT now() NULL,
	url_imagen text NULL,
	meta_template_id varchar NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT whatsapp_plantilla_pkey PRIMARY KEY (id),
	CONSTRAINT whatsapp_plantilla_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);


-- public.preguntas_frecuentes definition

-- Drop table

-- DROP TABLE public.preguntas_frecuentes;

CREATE TABLE public.preguntas_frecuentes (
	id serial4 NOT NULL,
	numero int4 NOT NULL,
	pregunta varchar(100) NOT NULL,
	proceso varchar(70) NULL,
	respuesta varchar(80) NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT preguntas_frecuentes_pkey PRIMARY KEY (id),
	CONSTRAINT preguntas_frecuentes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_preguntas_frecuentes_fecha_actualizacion before
update
    on
    public.preguntas_frecuentes for each row execute function fn_update_fecha_actualizacion();


-- public.recurso definition

-- Drop table

-- DROP TABLE public.recurso;

CREATE TABLE public.recurso (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	url varchar(500) NULL,
	id_tipo_recurso int4 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	id_modelo int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT recurso_pkey PRIMARY KEY (id),
	CONSTRAINT fk_recurso_id_modelo FOREIGN KEY (id_modelo) REFERENCES public.modelo(id),
	CONSTRAINT recurso_empresa_id_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT recurso_tipo_recurso_id_fkey FOREIGN KEY (id_tipo_recurso) REFERENCES public.tipo_recurso(id)
);


-- public.rol definition

-- Drop table

-- DROP TABLE public.rol;

CREATE TABLE public.rol (
	id serial4 NOT NULL,
	nombre varchar(50) NOT NULL,
	proposito varchar(150) NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT rol_pkey PRIMARY KEY (id),
	CONSTRAINT rol_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_rol_fecha_actualizacion before
update
    on
    public.rol for each row execute function fn_update_fecha_actualizacion();


-- public.sucursal definition

-- Drop table

-- DROP TABLE public.sucursal;

CREATE TABLE public.sucursal (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	definicion varchar(70) NULL,
	orden int4 DEFAULT 0 NOT NULL,
	color varchar(70) NULL,
	flag_asesor int4 DEFAULT 0 NOT NULL,
	flag_bot int4 DEFAULT 0 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT sucursal_pkey PRIMARY KEY (id),
	CONSTRAINT sucursal_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);

-- Table Triggers

create trigger trg_sucursal_fecha_actualizacion before
update
    on
    public.sucursal for each row execute function fn_update_fecha_actualizacion();


-- public.usuario definition

-- Drop table

-- DROP TABLE public.usuario;

CREATE TABLE public.usuario (
	id serial4 NOT NULL,
	usuario varchar(100) NOT NULL,
	email varchar(80) NOT NULL,
	"password" varchar(100) NOT NULL,
	reset_token varchar(100) NULL,
	reset_expiration timestamp NULL,
	id_sucursal int4 NOT NULL,
	id_padre int4 NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_rol int4 NULL,
	intentos_fallidos int4 NULL,
	fecha_desbloqueo timestamp NULL,
	fecha_ultimo_fallo date NULL,
	sperant_id int4 NULL,
	nombre_completo varchar(50) NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT usuario_pkey PRIMARY KEY (id),
	CONSTRAINT usuario_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT usuario_id_rol_fk FOREIGN KEY (id_rol) REFERENCES public.rol(id),
	CONSTRAINT usuario_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursal(id)
);
CREATE INDEX idx_asesor_empresa ON public.usuario USING btree (id_empresa);
CREATE INDEX idx_asesor_sucursal ON public.usuario USING btree (id_sucursal);

-- Table Triggers

create trigger trg_usuario_fecha_actualizacion before
update
    on
    public.usuario for each row execute function fn_update_fecha_actualizacion();


-- public."version" definition

-- Drop table

-- DROP TABLE public."version";

CREATE TABLE public."version" (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	descripcion varchar(255) NULL,
	caracteristicas_generales text NULL,
	caracteristicas_destacadas text NULL,
	color_disponible text NULL,
	variante text NULL,
	gama varchar(50) NULL,
	detalle_version text NULL,
	anio int4 NULL,
	precio_lista text NULL,
	cuota_bancaria text NULL,
	carroceria varchar(250) NULL,
	motor varchar(250) NULL,
	cilindrada varchar(250) NULL,
	transimision varchar(250) NULL,
	garantia varchar(250) NULL,
	potencia varchar(250) NULL,
	torque varchar(250) NULL,
	distancia_entre_ejes varchar(250) NULL,
	tamanio_aros varchar(250) NULL,
	dimensiones varchar(250) NULL,
	paquete_mantenimiento varchar(250) NULL,
	primer_servicio_mantenimiento varchar(250) NULL,
	frecuencia_mantenimiento varchar(250) NULL,
	ficha_tecnica text NULL,
	sunroof int4 DEFAULT 0 NULL,
	capacidad_maletero varchar(250) NULL,
	espejos_electricos int4 DEFAULT 0 NULL,
	aire_acondicionado int4 DEFAULT 0 NULL,
	radio_tactical varchar(250) NULL,
	camara_retroceso int4 DEFAULT 0 NULL,
	airbags varchar(250) NULL,
	sistema_frenos varchar(250) NULL,
	tipos_frenos varchar(250) NULL,
	alzavidrios_electricos int4 DEFAULT 0 NULL,
	volante_forrado_cuero int4 DEFAULT 0 NULL,
	palanca_forrado_cuero int4 DEFAULT 0 NULL,
	sensores_de_estacionamiento int4 DEFAULT 0 NULL,
	faros_delanteros_led int4 DEFAULT 0 NULL,
	faros_posteriores_led int4 DEFAULT 0 NULL,
	faros_neblineros int4 DEFAULT 0 NULL,
	panel_instrumentos varchar(250) NULL,
	tipo_llave varchar(250) NULL,
	conectividad_radio varchar(250) NULL,
	suspension_delanterios varchar(250) NULL,
	suspension_posterior varchar(250) NULL,
	llanta_repuesto varchar(250) NULL,
	cargador_inalambrico int4 DEFAULT 0 NULL,
	material_asientos varchar(250) NULL,
	maletero_inteligente int4 DEFAULT 0 NULL,
	asistencia_prevencion_colision int4 DEFAULT 0 NULL,
	asistencia_prevencion_punto_ciego int4 DEFAULT 0 NULL,
	asistencia_mantencion_carril int4 DEFAULT 0 NULL,
	asistencia_prevencion_coliseo_trafico_cruzado int4 DEFAULT 0 NULL,
	asistencia_seguimiento_carril int4 DEFAULT 0 NULL,
	control_crucero int4 DEFAULT 0 NULL,
	rieles_de_techo int4 DEFAULT 0 NULL,
	freno_estacionamiento varchar(250) NULL,
	numero_asientos int4 NULL,
	traccion varchar(250) NULL,
	monitor_punto_ciego int4 DEFAULT 0 NULL,
	asientos_electricos int4 DEFAULT 0 NULL,
	transmision_control_electronico int4 DEFAULT 0 NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_modelo int4 NULL,
	url_video varchar(100) NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT version_pkey PRIMARY KEY (id),
	CONSTRAINT version_id_modelo_fkey FOREIGN KEY (id_modelo) REFERENCES public.modelo(id)
);

-- Table Triggers

create trigger trg_version_fecha_actualizacion before
update
    on
    public.version for each row execute function fn_update_fecha_actualizacion();


-- public.campania definition

-- Drop table

-- DROP TABLE public.campania;

CREATE TABLE public.campania (
	id serial4 NOT NULL,
	nombre varchar(50) NOT NULL,
	descripcion varchar(50) NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_plantilla_whatsapp int4 NULL,
	id_plantilla int4 NULL,
	id_tipo_campania int4 NULL,
	id_estado_campania int4 NULL,
	id_estado_prospecto int4 NULL,
	configuracion_llamada jsonb NULL,
	id_voz int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT campania_pkey PRIMARY KEY (id),
	CONSTRAINT campania_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT campania_id_estado_campania_fkey FOREIGN KEY (id_estado_campania) REFERENCES public.estado_campania(id),
	CONSTRAINT campania_id_estado_prospecto_fkey FOREIGN KEY (id_estado_prospecto) REFERENCES public.estado_prospecto(id),
	CONSTRAINT campania_id_plantilla_fkey FOREIGN KEY (id_plantilla) REFERENCES public.plantilla(id),
	CONSTRAINT campania_id_plantilla_whatsapp_fkey FOREIGN KEY (id_plantilla_whatsapp) REFERENCES public.plantilla_whatsapp(id),
	CONSTRAINT campania_id_tipo_campania_fkey FOREIGN KEY (id_tipo_campania) REFERENCES public.tipo_campania(id)
);

-- Table Triggers

create trigger trg_campania_fecha_actualizacion before
update
    on
    public.campania for each row execute function fn_update_fecha_actualizacion();


-- public.campania_ejecucion definition

-- Drop table

-- DROP TABLE public.campania_ejecucion;

CREATE TABLE public.campania_ejecucion (
	id serial4 NOT NULL,
	fecha_programada timestamp NOT NULL,
	fecha_inicio timestamp NULL,
	fecha_fin timestamp NULL,
	resultado varchar(50) NULL,
	mensaje_error varchar(50) NULL,
	id_campania int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT campania_ejecucion_pkey PRIMARY KEY (id),
	CONSTRAINT campania_ejecucion_id_campania_fkey FOREIGN KEY (id_campania) REFERENCES public.campania(id)
);
CREATE INDEX idx_campania_ejecucion_campania ON public.campania_ejecucion USING btree (id_campania);

-- Table Triggers

create trigger trg_campania_ejecucion_fecha_actualizacion before
update
    on
    public.campania_ejecucion for each row execute function fn_update_fecha_actualizacion();


-- public.configuracion_campania_llamada definition

-- Drop table

-- DROP TABLE public.configuracion_campania_llamada;

CREATE TABLE public.configuracion_campania_llamada (
	id serial4 NOT NULL,
	id_campania int4 NOT NULL,
	dias_llamada varchar(50) DEFAULT 'lun,mar,mie,jue,vie'::character varying NOT NULL,
	hora_inicio time DEFAULT '09:00:00'::time without time zone NOT NULL,
	hora_fin time DEFAULT '18:00:00'::time without time zone NOT NULL,
	max_intentos int4 DEFAULT 3 NOT NULL,
	intervalo_reintento int4 DEFAULT 60 NULL,
	estado_registro int4 DEFAULT 1 NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	fecha_actualizacion timestamp DEFAULT now() NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT configuracion_campania_llamada_id_campania_key UNIQUE (id_campania),
	CONSTRAINT configuracion_campania_llamada_pkey PRIMARY KEY (id),
	CONSTRAINT configuracion_campania_llamada_id_campania_fkey FOREIGN KEY (id_campania) REFERENCES public.campania(id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- public.configuracion_llamada definition

-- Drop table

-- DROP TABLE public.configuracion_llamada;

CREATE TABLE public.configuracion_llamada (
	id serial4 NOT NULL,
	id_campania int4 NOT NULL,
	dia varchar(3) NOT NULL,
	activo int4 DEFAULT 0 NOT NULL,
	hora_inicio time DEFAULT '09:00:00'::time without time zone NOT NULL,
	hora_fin time DEFAULT '18:00:00'::time without time zone NOT NULL,
	max_intentos int4 DEFAULT 3 NOT NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	estado_registro int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT configuracion_llamada_id_campania_dia_key UNIQUE (id_campania, dia),
	CONSTRAINT configuracion_llamada_pkey PRIMARY KEY (id),
	CONSTRAINT configuracion_llamada_id_campania_fkey FOREIGN KEY (id_campania) REFERENCES public.campania(id)
);
CREATE INDEX idx_config_llamada_campania ON public.configuracion_llamada USING btree (id_campania);


-- public.dia_descanso definition

-- Drop table

-- DROP TABLE public.dia_descanso;

CREATE TABLE public.dia_descanso (
	id serial4 NOT NULL,
	id_usuario int4 NOT NULL,
	fecha_registro timestamp DEFAULT now() NULL,
	fecha_actualizacion timestamp NULL,
	usuario_registro int4 NULL,
	usuario_actualizacion int4 NULL,
	estado_registro int4 NULL,
	fecha_descanso date NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT dia_descanso_pkey PRIMARY KEY (id),
	CONSTRAINT dia_descanso_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id)
);

-- Table Triggers

create trigger trg_dia_descanso_fecha_actualizacion before
update
    on
    public.dia_descanso for each row execute function fn_update_fecha_actualizacion();


-- public.envio_masivo_whatsapp definition

-- Drop table

-- DROP TABLE public.envio_masivo_whatsapp;

CREATE TABLE public.envio_masivo_whatsapp (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	id_plantilla int4 NOT NULL,
	titulo varchar NULL,
	descripcion varchar NULL,
	cantidad int4 NULL,
	cantidad_exitosos int4 NULL,
	cantidad_fallidos int4 NULL,
	fecha_envio date NULL,
	estado_envio public.estado_envio_enum NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_registro int4 NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_actualizacion int4 NULL,
	estado_registro int4 DEFAULT 1 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT envio_masivo_whatsapp_pk PRIMARY KEY (id),
	CONSTRAINT envio_masivo_whatsapp_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT envio_masivo_whatsapp_plantilla_whatsapp_fk FOREIGN KEY (id_plantilla) REFERENCES public.plantilla_whatsapp(id)
);


-- public.job_queue definition

-- Drop table

-- DROP TABLE public.job_queue;

CREATE TABLE public.job_queue (
	id serial4 NOT NULL,
	tipo varchar(50) DEFAULT 'llamadas_masivas'::character varying NOT NULL,
	id_campania int4 NOT NULL,
	id_campania_ejecucion int4 NOT NULL,
	id_empresa int4 NOT NULL,
	config_json jsonb NOT NULL,
	filtro_numeros jsonb NULL,
	es_rellamada bool DEFAULT false NULL,
	estado varchar(20) DEFAULT 'pending'::character varying NOT NULL,
	total_registros int4 DEFAULT 0 NULL,
	registros_procesados int4 DEFAULT 0 NULL,
	ultimo_id_procesado int4 DEFAULT 0 NULL,
	ronda_actual int4 DEFAULT 1 NULL,
	max_rondas int4 DEFAULT 1 NULL,
	llamadas_enviadas int4 DEFAULT 0 NULL,
	llamadas_fallidas int4 DEFAULT 0 NULL,
	error_mensaje text NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	fecha_inicio timestamp NULL,
	fecha_fin timestamp NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT job_queue_pkey PRIMARY KEY (id),
	CONSTRAINT fk_job_campania FOREIGN KEY (id_campania) REFERENCES public.campania(id),
	CONSTRAINT fk_job_ejecucion FOREIGN KEY (id_campania_ejecucion) REFERENCES public.campania_ejecucion(id),
	CONSTRAINT fk_job_empresa FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);
CREATE INDEX idx_job_queue_campania ON public.job_queue USING btree (id_campania);
CREATE INDEX idx_job_queue_ejecucion ON public.job_queue USING btree (id_campania_ejecucion);
CREATE INDEX idx_job_queue_estado ON public.job_queue USING btree (estado);
CREATE INDEX idx_job_queue_estado_fecha ON public.job_queue USING btree (estado, fecha_registro);


-- public.modulo definition

-- Drop table

-- DROP TABLE public.modulo;

CREATE TABLE public.modulo (
	id serial4 NOT NULL,
	nombre varchar(50) NOT NULL,
	ruta varchar(70) NOT NULL,
	id_rol int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT modulo_pkey PRIMARY KEY (id),
	CONSTRAINT modulo_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.rol(id)
);

-- Table Triggers

create trigger trg_modulo_fecha_actualizacion before
update
    on
    public.modulo for each row execute function fn_update_fecha_actualizacion();


-- public.prospecto definition

-- Drop table

-- DROP TABLE public.prospecto;

CREATE TABLE public.prospecto (
	id serial4 NOT NULL,
	nombre_completo varchar(100) NOT NULL,
	dni varchar(50) NULL,
	direccion varchar(100) NULL,
	celular varchar(100) NULL,
	perfilamiento int4 DEFAULT 0 NULL,
	puntaje float8 DEFAULT 0 NULL,
	id_usuario int4 NULL,
	id_estado_prospecto int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_empresa int4 NULL,
	email varchar(100) NULL,
	sperant_id varchar(100) NULL,
	fue_contactado int4 DEFAULT 0 NOT NULL,
	calificacion_lead varchar(20) DEFAULT 'frio'::character varying NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT prospecto_pkey PRIMARY KEY (id),
	CONSTRAINT prospecto_sperant_uuid_key UNIQUE (sperant_id),
	CONSTRAINT prospecto__id_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT prospecto_id_estado_prospecto_fkey FOREIGN KEY (id_estado_prospecto) REFERENCES public.estado_prospecto(id),
	CONSTRAINT prospecto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id)
);
CREATE INDEX idx_prospecto_celular ON public.prospecto USING btree (celular);
CREATE INDEX idx_prospecto_dni ON public.prospecto USING btree (dni);
CREATE INDEX idx_prospecto_estado ON public.prospecto USING btree (id_estado_prospecto);

-- Table Triggers

create trigger trg_prospecto_fecha_actualizacion before
update
    on
    public.prospecto for each row execute function fn_update_fecha_actualizacion();


-- public.prospecto_recordatorio definition

-- Drop table

-- DROP TABLE public.prospecto_recordatorio;

CREATE TABLE public.prospecto_recordatorio (
	id serial4 NOT NULL,
	cantidad int4 DEFAULT 0 NOT NULL,
	limite int4 NOT NULL,
	id_prospecto int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT prospecto_recordatorio_pkey PRIMARY KEY (id),
	CONSTRAINT prospecto_recordatorio_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);

-- Table Triggers

create trigger trg_prospecto_recordatorio_fecha_actualizacion before
update
    on
    public.prospecto_recordatorio for each row execute function fn_update_fecha_actualizacion();


-- public.rol_modulo definition

-- Drop table

-- DROP TABLE public.rol_modulo;

CREATE TABLE public.rol_modulo (
	id serial4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	id_modulo int4 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT rol_modulo_pkey PRIMARY KEY (id),
	CONSTRAINT rol_modulo_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.modulo(id)
);

-- Table Triggers

create trigger trg_rol_modulo_fecha_actualizacion before
update
    on
    public.rol_modulo for each row execute function fn_update_fecha_actualizacion();


-- public.tipificacion definition

-- Drop table

-- DROP TABLE public.tipificacion;

CREATE TABLE public.tipificacion (
	id serial4 NOT NULL,
	nombre varchar(100) NOT NULL,
	tipo varchar(100) NOT NULL,
	telefono int4 NULL,
	correo varchar(50) NULL,
	fecha_hora_cita timestamp NULL,
	id_prospecto int4 NOT NULL,
	piso_referidos int4 DEFAULT 0 NULL,
	resumen text NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	duracion_cita int4 NULL,
	id_marca int4 NULL,
	id_version int4 NULL,
	id_modelo int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT tipificacion_pkey PRIMARY KEY (id),
	CONSTRAINT fk_tipificacion_id_marca FOREIGN KEY (id_marca) REFERENCES public.marca(id),
	CONSTRAINT fk_tipificacion_id_modelo FOREIGN KEY (id_modelo) REFERENCES public.modelo(id),
	CONSTRAINT fk_tipificacion_id_version FOREIGN KEY (id_version) REFERENCES public."version"(id),
	CONSTRAINT tipificacion_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);

-- Table Triggers

create trigger trg_tipificacion_fecha_actualizacion before
update
    on
    public.tipificacion for each row execute function fn_update_fecha_actualizacion();


-- public.campania_prospectos definition

-- Drop table

-- DROP TABLE public.campania_prospectos;

CREATE TABLE public.campania_prospectos (
	id serial4 NOT NULL,
	id_campania int4 NOT NULL,
	id_prospecto int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT campania_prospectos_pkey PRIMARY KEY (id),
	CONSTRAINT campania_prospectos_id_campania_fkey FOREIGN KEY (id_campania) REFERENCES public.campania(id),
	CONSTRAINT campania_prospectos_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);
CREATE INDEX idx_campania_prospectos_ejecucion ON public.campania_prospectos USING btree (id_campania);

-- Table Triggers

create trigger trg_campania_prospectos_fecha_actualizacion before
update
    on
    public.campania_prospectos for each row execute function fn_update_fecha_actualizacion();


-- public.chat definition

-- Drop table

-- DROP TABLE public.chat;

CREATE TABLE public.chat (
	id serial4 NOT NULL,
	id_prospecto int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	bot_activo int4 DEFAULT 1 NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT chat_pkey PRIMARY KEY (id),
	CONSTRAINT chat_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);
CREATE INDEX idx_chat_prospecto ON public.chat USING btree (id_prospecto);
CREATE INDEX idx_chat_prospecto_fecha ON public.chat USING btree (id_prospecto, fecha_registro DESC);

-- Table Triggers

create trigger trg_chat_fecha_actualizacion before
update
    on
    public.chat for each row execute function fn_update_fecha_actualizacion();


-- public.cita definition

-- Drop table

-- DROP TABLE public.cita;

CREATE TABLE public.cita (
	id serial4 NOT NULL,
	nombre varchar(150) NOT NULL,
	hora_inicio timestamp NOT NULL,
	hora_fin timestamp NOT NULL,
	descripcion varchar(100) NULL,
	id_prospecto int4 NULL,
	id_estado_cita int4 NOT NULL,
	id_usuario int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_sucursal int4 NULL,
	id_marca int4 NULL,
	id_modelo int4 NULL,
	id_version int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT cita_pkey PRIMARY KEY (id),
	CONSTRAINT cita_id_estado_cita_fkey FOREIGN KEY (id_estado_cita) REFERENCES public.estado_cita(id),
	CONSTRAINT cita_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id),
	CONSTRAINT cita_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id),
	CONSTRAINT fk_cita_id_marca FOREIGN KEY (id_marca) REFERENCES public.marca(id),
	CONSTRAINT fk_cita_id_modelo FOREIGN KEY (id_modelo) REFERENCES public.modelo(id),
	CONSTRAINT fk_cita_id_sucursal FOREIGN KEY (id_sucursal) REFERENCES public.sucursal(id),
	CONSTRAINT fk_cita_id_version FOREIGN KEY (id_version) REFERENCES public."version"(id)
);
CREATE INDEX idx_cita_asesor ON public.cita USING btree (id_usuario);
CREATE INDEX idx_cita_estado ON public.cita USING btree (id_estado_cita);
CREATE INDEX idx_cita_hora ON public.cita USING btree (hora_inicio);

-- Table Triggers

create trigger trg_cita_fecha_actualizacion before
update
    on
    public.cita for each row execute function fn_update_fecha_actualizacion();


-- public.envios_prospectos definition

-- Drop table

-- DROP TABLE public.envios_prospectos;

CREATE TABLE public.envios_prospectos (
	id serial4 NOT NULL,
	id_envio_masivo int4 NOT NULL,
	id_prospecto int4 NULL,
	estado public.estado_envio_enum NULL,
	fecha_envio date NULL,
	error_mensaje varchar NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_registro int4 NULL,
	fecha_actualizacion timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	usuario_actualizacion int4 NULL,
	estado_registro int4 DEFAULT 1 NULL,
	id_campania_ejecucion int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT envios_prospectos_pk PRIMARY KEY (id),
	CONSTRAINT envios_prospectos_envio_masivo_whatsapp_fk FOREIGN KEY (id_envio_masivo) REFERENCES public.envio_masivo_whatsapp(id),
	CONSTRAINT envios_prospectos_id_campania_ejecucion_fkey FOREIGN KEY (id_campania_ejecucion) REFERENCES public.campania_ejecucion(id),
	CONSTRAINT envios_prospectos_prospecto_fk FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);
CREATE INDEX idx_envios_prospectos_campania_ejecucion ON public.envios_prospectos USING btree (id_campania_ejecucion);


-- public.interaccion definition

-- Drop table

-- DROP TABLE public.interaccion;

CREATE TABLE public.interaccion (
	id serial4 NOT NULL,
	satisfactorio int4 DEFAULT 0 NOT NULL,
	id_tipo_interaccion int4 NULL,
	id_usuario int4 NULL,
	id_nivel_interes int4 NULL,
	id_unidad int4 NULL,
	id_prospecto int4 NOT NULL,
	utm_term varchar(100) NULL,
	observaciones varchar(255) NULL,
	id_motivo_desistimiento int4 NULL,
	id_canal_entrada int4 NULL,
	id_medio_captacion int4 NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_marca int4 NULL,
	id_modelo int4 NULL,
	id_version int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT interaccion_pkey PRIMARY KEY (id),
	CONSTRAINT fk_interaccion_id_marca FOREIGN KEY (id_marca) REFERENCES public.marca(id),
	CONSTRAINT fk_interaccion_id_modelo FOREIGN KEY (id_modelo) REFERENCES public.modelo(id),
	CONSTRAINT fk_interaccion_id_version FOREIGN KEY (id_version) REFERENCES public."version"(id),
	CONSTRAINT interaccion_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);
CREATE INDEX idx_interaccion_prospecto ON public.interaccion USING btree (id_prospecto);

-- Table Triggers

create trigger trg_interaccion_fecha_actualizacion before
update
    on
    public.interaccion for each row execute function fn_update_fecha_actualizacion();


-- public.llamada definition

-- Drop table

-- DROP TABLE public.llamada;

CREATE TABLE public.llamada (
	id serial4 NOT NULL,
	provider_call_id varchar(100) NULL,
	fecha_inicio timestamp NULL,
	fecha_fin timestamp NULL,
	duracion_seg int4 DEFAULT 0 NULL,
	metadata_json jsonb NULL,
	url_audio varchar(100) NULL,
	id_estado_llamada int4 NULL,
	id_prospecto int4 NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	archivo_llamada varchar(500) NULL,
	id_campania_ejecucion int4 NULL,
	id_ultravox_call varchar(100) NULL,
	metadata_ultravox_call jsonb NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT llamada_pkey PRIMARY KEY (id),
	CONSTRAINT llamada_provider_call_id_unique UNIQUE (provider_call_id),
	CONSTRAINT fk_llamada_campania_ejecucion FOREIGN KEY (id_campania_ejecucion) REFERENCES public.campania_ejecucion(id),
	CONSTRAINT llamada_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT llamada_id_estado_llamada_fkey FOREIGN KEY (id_estado_llamada) REFERENCES public.estado_llamada(id),
	CONSTRAINT llamada_id_prospecto_fkey FOREIGN KEY (id_prospecto) REFERENCES public.prospecto(id)
);
CREATE INDEX idx_llamada_campania_ejecucion ON public.llamada USING btree (id_campania_ejecucion);
CREATE INDEX idx_llamada_empresa ON public.llamada USING btree (id_empresa);
CREATE INDEX idx_llamada_estado ON public.llamada USING btree (id_estado_llamada);
CREATE INDEX idx_llamada_fecha ON public.llamada USING btree (fecha_inicio);
CREATE INDEX idx_llamada_prospecto ON public.llamada USING btree (id_prospecto);

-- Table Triggers

create trigger trg_llamada_fecha_actualizacion before
update
    on
    public.llamada for each row execute function fn_update_fecha_actualizacion();


-- public.mensaje definition

-- Drop table

-- DROP TABLE public.mensaje;

CREATE TABLE public.mensaje (
	id serial4 NOT NULL,
	direccion varchar(70) NOT NULL,
	tipo_mensaje varchar(40) NOT NULL,
	wid_mensaje varchar(100) NULL,
	contenido text NULL,
	contenido_archivo text NULL,
	fecha_hora timestamp DEFAULT now() NOT NULL,
	id_usuario int4 NULL,
	id_chat int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_plantilla_whatsapp int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT mensaje_pkey PRIMARY KEY (id),
	CONSTRAINT mensaje_id_chat_fkey FOREIGN KEY (id_chat) REFERENCES public.chat(id),
	CONSTRAINT mensaje_id_plantilla_whatsapp_fkey FOREIGN KEY (id_plantilla_whatsapp) REFERENCES public.plantilla_whatsapp(id)
);
CREATE INDEX idx_mensaje_chat_direccion ON public.mensaje USING btree (id_chat, direccion);
CREATE INDEX idx_mensaje_chat_estado_fecha ON public.mensaje USING btree (id_chat, estado_registro, fecha_hora DESC);
CREATE INDEX idx_mensaje_fecha ON public.mensaje USING btree (fecha_hora);
CREATE INDEX idx_mensaje_id_chat ON public.mensaje USING btree (id_chat);
CREATE INDEX idx_mensaje_id_chat_fecha ON public.mensaje USING btree (id_chat, fecha_hora DESC);
CREATE INDEX idx_mensaje_id_plantilla_whatsapp ON public.mensaje USING btree (id_plantilla_whatsapp);

-- Table Triggers

create trigger trg_mensaje_fecha_actualizacion before
update
    on
    public.mensaje for each row execute function fn_update_fecha_actualizacion();


-- public.mensaje_visto definition

-- Drop table

-- DROP TABLE public.mensaje_visto;

CREATE TABLE public.mensaje_visto (
	id int4 DEFAULT nextval('mensaje_visto_usuario_id_seq'::regclass) NOT NULL,
	fecha_visto timestamp DEFAULT now() NOT NULL,
	id_mensaje int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	tipo_recuperacion varchar(10) NULL,
	mensaje_enviado bool NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT mensaje_visto_usuario_pkey PRIMARY KEY (id),
	CONSTRAINT mensaje_visto_usuario_id_mesaje_fkey FOREIGN KEY (id_mensaje) REFERENCES public.mensaje(id)
);

-- Table Triggers

create trigger trg_mensaje_visto_usuario_fecha_actualizacion before
update
    on
    public.mensaje_visto for each row execute function fn_update_fecha_actualizacion();


-- public.pregunta_frecuente definition

-- Drop table

-- DROP TABLE public.pregunta_frecuente;

CREATE TABLE public.pregunta_frecuente (
	id serial4 NOT NULL,
	id_llamada int4 NOT NULL,
	tipo varchar(20) NOT NULL,
	contenido varchar(255) NOT NULL,
	frecuencia int4 DEFAULT 1 NOT NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT pregunta_frecuente_pkey PRIMARY KEY (id),
	CONSTRAINT pregunta_frecuente_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT pregunta_frecuente_id_llamada_fkey FOREIGN KEY (id_llamada) REFERENCES public.llamada(id)
);
CREATE INDEX idx_pregunta_frecuente_contenido ON public.pregunta_frecuente USING btree (id_empresa, tipo, contenido) WHERE (estado_registro = 1);
CREATE INDEX idx_pregunta_frecuente_empresa ON public.pregunta_frecuente USING btree (id_empresa, estado_registro);
CREATE INDEX idx_pregunta_frecuente_llamada ON public.pregunta_frecuente USING btree (id_llamada);
CREATE INDEX idx_pregunta_frecuente_tipo ON public.pregunta_frecuente USING btree (id_empresa, tipo) WHERE (estado_registro = 1);


-- public.transcripcion definition

-- Drop table

-- DROP TABLE public.transcripcion;

CREATE TABLE public.transcripcion (
	id serial4 NOT NULL,
	texto text NOT NULL,
	id_llamada int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	usuario_actualizacion int4 NULL,
	id_speaker int4 NULL,
	inicio_seg float8 NULL,
	fin_seg float8 NULL,
	speaker_role varchar(20) NULL,
	ordinal int4 NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT transcripcion_pkey PRIMARY KEY (id),
	CONSTRAINT transcripcion_id_llamada_fkey FOREIGN KEY (id_llamada) REFERENCES public.llamada(id),
	CONSTRAINT transcripcion_id_speaker_fkey FOREIGN KEY (id_speaker) REFERENCES public.speaker(id)
);
CREATE INDEX idx_transcripcion_llamada ON public.transcripcion USING btree (id_llamada);

-- Table Triggers

create trigger trg_transcripcion_fecha_actualizacion before
update
    on
    public.transcripcion for each row execute function fn_update_fecha_actualizacion();


-- public.analisis_llamada definition

-- Drop table

-- DROP TABLE public.analisis_llamada;

CREATE TABLE public.analisis_llamada (
	id serial4 NOT NULL,
	id_llamada int4 NOT NULL,
	total_tokens int4 NULL,
	total_palabras int4 NULL,
	tiempo_habla_seg int4 NULL,
	tiempo_silencio_seg int4 NULL,
	cumplimiento_protocolo float8 NULL,
	fcr bool DEFAULT false NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT analisis_llamada_pkey PRIMARY KEY (id),
	CONSTRAINT analisis_llamada_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT analisis_llamada_id_llamada_fkey FOREIGN KEY (id_llamada) REFERENCES public.llamada(id)
);
CREATE INDEX idx_analisis_llamada_empresa ON public.analisis_llamada USING btree (id_empresa, estado_registro);
CREATE INDEX idx_analisis_llamada_fcr ON public.analisis_llamada USING btree (id_empresa, fcr) WHERE (estado_registro = 1);
CREATE INDEX idx_analisis_llamada_llamada ON public.analisis_llamada USING btree (id_llamada);


-- public.analisis_sentimiento definition

-- Drop table

-- DROP TABLE public.analisis_sentimiento;

CREATE TABLE public.analisis_sentimiento (
	id serial4 NOT NULL,
	id_llamada int4 NOT NULL,
	sentimiento varchar(20) NOT NULL,
	score_sentimiento float8 DEFAULT 0 NULL,
	emocion_principal varchar(30) NULL,
	score_emocion float8 DEFAULT 0 NULL,
	id_empresa int4 NOT NULL,
	estado_registro int4 DEFAULT 1 NOT NULL,
	usuario_registro int4 DEFAULT 1 NULL,
	usuario_actualizacion int4 DEFAULT 1 NULL,
	fecha_registro timestamp DEFAULT now() NOT NULL,
	fecha_actualizacion timestamp DEFAULT now() NOT NULL,
	extra_fields jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT analisis_sentimiento_pkey PRIMARY KEY (id),
	CONSTRAINT analisis_sentimiento_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id),
	CONSTRAINT analisis_sentimiento_id_llamada_fkey FOREIGN KEY (id_llamada) REFERENCES public.llamada(id)
);
CREATE INDEX idx_analisis_sentimiento_emocion ON public.analisis_sentimiento USING btree (id_empresa, emocion_principal) WHERE (estado_registro = 1);
CREATE INDEX idx_analisis_sentimiento_empresa ON public.analisis_sentimiento USING btree (id_empresa, estado_registro);
CREATE INDEX idx_analisis_sentimiento_llamada ON public.analisis_sentimiento USING btree (id_llamada);
CREATE INDEX idx_analisis_sentimiento_tipo ON public.analisis_sentimiento USING btree (id_empresa, sentimiento) WHERE (estado_registro = 1);


-- public.prompt_asistente definition

-- Drop table

-- DROP TABLE public.prompt_asistente;

CREATE TABLE public.prompt_asistente (
	id serial4 NOT NULL,
	id_empresa int4 NOT NULL,
	prompt_sistema text NOT NULL,
	estado_registro int2 DEFAULT 1 NOT NULL,
	usuario_registro int4 NULL,
	usuario_actualizacion int4 NULL,
	fecha_registro timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	fecha_actualizacion timestamp NULL,
	CONSTRAINT prompt_asistente_pkey PRIMARY KEY (id),
	CONSTRAINT uk_prompt_asistente_activo UNIQUE (id_empresa, estado_registro),
	CONSTRAINT prompt_asistente_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id)
);
CREATE INDEX idx_prompt_asistente_empresa ON public.prompt_asistente USING btree (id_empresa, estado_registro);


-- public.tabla_gqm_lead definition

-- Drop table

-- DROP TABLE public.tabla_gqm_lead;

CREATE TABLE public.tabla_gqm_lead (
	id serial4 NOT NULL,
	numero varchar(50) NOT NULL,
	n_lead varchar(50) NOT NULL,
	source_id varchar(100) NULL,
	nombre varchar(250) NULL,
	marca varchar(250) NULL,
	modelo varchar(250) NULL,
	CONSTRAINT tabla_gqm_lead_pkey PRIMARY KEY (id),
	CONSTRAINT tabla_gqm_lead_n_lead_key UNIQUE (n_lead)
);
