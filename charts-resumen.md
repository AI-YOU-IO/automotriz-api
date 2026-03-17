
# Resumen de Charts y Dashboards - VIVA (Español)

## Información General
- **Base de rutas**: `GET /api/` (sin autenticación)
- **Archivo de rutas**: `src/routes/reportes.route.js`
- **Controlador**: `src/controllers/reportes.controller.js`
- **Filtro global**: Todas las consultas filtran por `idEmpresa` (cada empresa ve solo sus datos)

---

## 1. Dashboard General (`/dashboard`)

**Endpoint**: `GET /dashboard?idEmpresa={id}`

### Métricas (Cards superiores)

| Métrica | Descripción en español |
|---------|----------------------|
| **Total Leads** | Conteo de todos los prospectos con estado de registro activo (`estado_registro = 1`) filtrado por empresa |
| **Interesados** | Conteo de prospectos con calificación de lead "tibio" o "caliente" (Tibio + Caliente) |
| **Leads Semana** | Conteo de prospectos nuevos registrados en los últimos 7 días (desde la fecha actual hacia atrás) |
| **Tasa Conversión** | Porcentaje calculado: `interesados / totalLeads * 100`. Ejemplo: si hay 1004 leads y 400 interesados = 40% |
| **Contactados** | Conteo de prospectos que tienen el campo `fue_contactado = 1` (ya fueron contactados al menos una vez) |

### Pipeline (Gráfica de barras)

| Dato | Descripción |
|------|-------------|
| **Pipeline por estado** | Muestra barras con la cantidad de prospectos agrupados por su estado (ej: Nuevo, En seguimiento, Cerrado). Cada estado tiene su color definido en la tabla `estado_prospecto`. Se ordenan por el campo `orden` |

### SQL que se ejecuta

```sql
-- Total Leads: Cuenta todos los prospectos activos de la empresa
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa

-- Interesados: Solo cuenta los que tienen calificación tibio o caliente
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa
AND p.calificacion_lead IN ('tibio', 'caliente')

-- Leads Semana: Prospectos creados en los últimos 7 días
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa
AND p.fecha_registro >= CURRENT_DATE - INTERVAL '7 days'

-- Contactados: Prospectos marcados como contactados
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa
AND p.fue_contactado = 1

-- Pipeline: Agrupa prospectos por estado y los cuenta
SELECT ep.nombre, ep.color, COUNT(p.id) as total
FROM estado_prospecto ep
LEFT JOIN prospecto p ON p.id_estado_prospecto = ep.id AND p.estado_registro = 1
  AND p.id_empresa = :idEmpresa
WHERE ep.estado_registro = 1 AND ep.id_empresa = :idEmpresa
GROUP BY ep.id, ep.nombre, ep.color, ep.orden
ORDER BY ep.orden
```

### Tablas que se consultan
- `prospecto` — Tabla principal de leads/prospectos
- `estado_prospecto` — Catálogo de estados (Nuevo, En seguimiento, etc.)

---

## 2. Dashboard WhatsApp (`/` página principal)

**Endpoint**: `GET /whatsapp-dashboard?idEmpresa={id}`

### Concepto clave: "Chats válidos"
Todas las métricas de este dashboard solo cuentan chats que tienen al menos 1 mensaje enviado con una plantilla de WhatsApp (`id_plantilla_whatsapp IS NOT NULL`). Esto filtra solo las conversaciones iniciadas vía campañas de WhatsApp.

### Métricas (Cards superiores)

| Métrica | Descripción en español |
|---------|----------------------|
| **Conversaciones** | Conteo de chats únicos que tienen al menos un mensaje enviado con plantilla de WhatsApp. Solo cuenta chats activos de prospectos activos de la empresa |
| **Enviados** | Conteo total de mensajes de salida (`direccion = 'out'`) dentro de los chats válidos |
| **Recibidos** | Conteo total de mensajes de entrada (`direccion = 'in'`) dentro de los chats válidos. Son las respuestas del prospecto |
| **Tasa Respuesta** | Porcentaje de chats válidos que recibieron al menos 1 respuesta del prospecto. Se calcula: `chats con respuesta / total chats válidos * 100` |
| **Leads Semana** | Conteo de chats válidos creados en los últimos 7 días |

### Secciones adicionales

| Sección | Descripción |
|---------|-------------|
| **Pipeline** | Barras por estado del prospecto, pero solo contando prospectos que tienen chats válidos (con plantilla WS) |
| **Conversaciones recientes** | Últimos 4 chats válidos con: nombre del prospecto, celular, estado, último mensaje (usa LATERAL JOIN para obtener el mensaje más reciente de cada chat) |
| **Evolución diaria** | Gráfica de barras con mensajes enviados vs respondidos por día en los últimos 7 días. Usa `FILTER (WHERE direccion = 'out')` para enviados y `FILTER (WHERE direccion = 'in')` para respondidos |
| **Rendimiento plantillas** | Top 5 plantillas WhatsApp más usadas. Muestra cuántos mensajes se enviaron con cada plantilla y cuántos de esos chats recibieron respuesta después |
| **Campañas recientes** | Últimas 4 campañas WhatsApp con su estado (FINALIZADA, ACTIVA, PROGRAMADA, PENDIENTE) y cantidad de prospectos enviados |
| **Plantillas activas** | Conteo simple de plantillas WhatsApp con estado activo en la empresa |
| **Campañas en curso** | Conteo de campañas WhatsApp que ya iniciaron pero aún no finalizaron (`fecha_inicio IS NOT NULL AND fecha_fin IS NULL`) |
| **Contactos alcanzados** | Cantidad de prospectos únicos que aparecen en los chats válidos (un prospecto puede tener varios chats, pero se cuenta una sola vez) |
| **Tiempo promedio respuesta** | Promedio en minutos entre cada mensaje enviado (out) y la primera respuesta recibida (in) del prospecto. Se muestra como "Xh Ym" o "Xm" |

### SQL principal (CTE chats_validos)

```sql
-- Este CTE se usa en casi todas las consultas de este dashboard
-- Filtra solo chats que tienen al menos 1 mensaje con plantilla WhatsApp
WITH chats_validos AS (
  SELECT DISTINCT m.id_chat
  FROM mensaje m
  INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
  INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
  WHERE m.id_plantilla_whatsapp IS NOT NULL AND m.estado_registro = 1
  AND p.id_empresa = :idEmpresa
)

-- Conversaciones recientes: usa LATERAL JOIN para traer el último mensaje de cada chat
SELECT c.id, p.nombre_completo, p.celular, ep.nombre as estado,
  ultimo_msg.contenido, ultimo_msg.fecha_hora
FROM chats_validos cv
INNER JOIN chat c ON c.id = cv.id_chat
INNER JOIN prospecto p ON p.id = c.id_prospecto
LEFT JOIN LATERAL (
  SELECT m.contenido, m.fecha_hora, m.direccion FROM mensaje m
  WHERE m.id_chat = c.id AND m.estado_registro = 1
  ORDER BY m.fecha_hora DESC LIMIT 1
) ultimo_msg ON true
ORDER BY ultimo_msg.fecha_hora DESC NULLS LAST LIMIT 4

-- Rendimiento plantillas: cuenta envíos y respuestas por plantilla
SELECT pw.name, COUNT(m.id) as enviados,
  COUNT(m.id) FILTER (WHERE EXISTS (
    SELECT 1 FROM mensaje m2 WHERE m2.id_chat = m.id_chat
    AND m2.direccion = 'in' AND m2.fecha_hora > m.fecha_hora
  )) as respondidos
FROM plantilla_whatsapp pw
INNER JOIN mensaje m ON m.id_plantilla_whatsapp = pw.id
GROUP BY pw.id, pw.name ORDER BY enviados DESC LIMIT 5

-- Tiempo promedio respuesta: diferencia en minutos entre mensaje out y primer in
SELECT AVG(tiempo_respuesta) as promedio_minutos FROM (
  SELECT EXTRACT(EPOCH FROM (MIN(m_in.fecha_hora) - m_out.fecha_hora)) / 60 as tiempo_respuesta
  FROM mensaje m_out
  INNER JOIN mensaje m_in ON m_in.id_chat = m_out.id_chat
    AND m_in.direccion = 'in' AND m_in.fecha_hora > m_out.fecha_hora
  WHERE m_out.direccion = 'out'
  GROUP BY m_out.id, m_out.id_chat, m_out.fecha_hora
) sub WHERE tiempo_respuesta > 0
```

### Tablas que se consultan
- `mensaje` — Todos los mensajes (entrada y salida)
- `chat` — Conversaciones entre asesor y prospecto
- `prospecto` — Datos del lead
- `estado_prospecto` — Catálogo de estados
- `plantilla_whatsapp` — Plantillas aprobadas de WhatsApp
- `campania` — Campañas creadas
- `campania_ejecucion` — Ejecuciones de cada campaña
- `campania_prospectos` — Prospectos asignados a cada ejecución

---

## 3. Resumen General (`/dashboard/resumen`)

**Endpoint**: `GET /resumen?idEmpresa={id}&dateFrom={fecha}&dateTo={fecha}`

Este es el dashboard más completo. Ejecuta **18 consultas SQL en paralelo** (usando `Promise.all`). Soporta filtro por rango de fechas.

### KPIs (Cards superiores con % de cambio)

| Métrica | Descripción en español |
|---------|----------------------|
| **Total leads** | Conteo de prospectos activos de la empresa. Incluye % de cambio vs el mes anterior (sube o baja respecto al mes pasado) |
| **Contactados** | Conteo de prospectos con `fue_contactado = 1`. También muestra % de cambio vs mes anterior |
| **Interesados** | Conteo de prospectos con calificación "tibio" o "caliente". Con % de cambio vs mes anterior |
| **Citados** | Conteo de prospectos únicos que tienen al menos una cita registrada en la tabla `cita` |

### Charts principales

| Chart | Tipo visual | Descripción en español |
|-------|-------------|----------------------|
| **Embudo de conversión** | Funnel | Muestra prospectos agrupados por estado (`estado_prospecto`). Cada barra representa un estado (ej: Nuevo, Contactado, Interesado) con su color y se ordena por el campo `orden`. Visualiza cómo van "cayendo" los prospectos por el embudo |
| **Lead Scoring** | Barras verticales | Tres barras: Frío (prospectos sin calificación o con "frio"), Tibio (calificación "tibio"), Caliente (calificación "caliente"). Muestra la distribución de temperatura de los leads |
| **Conversaciones abandonadas** | Funnel de 3 niveles | Total de chats, Abandonados (chats donde el último mensaje es de salida y tiene más de 24 horas sin respuesta), Activos (chats donde el último mensaje es de entrada o tiene menos de 24 horas). Usa LATERAL JOIN para obtener el último mensaje de cada chat |
| **Utilidad de información** | Donut/Rosquilla | Tres segmentos: "Sí" (interacciones donde `satisfactorio = 1`), "No" (`satisfactorio = 0`), "No responde" (`satisfactorio IS NULL`). Mide si la información proporcionada al prospecto fue útil |
| **Asistencia humana** | Donut/Rosquilla | Dos segmentos: "Con humano" (chats donde `bot_activo = 0`, un asesor tomó el control) y "Solo bot" (chats donde `bot_activo = 1`, el bot manejó toda la conversación) |
| **Tipo de conversación** | Donut/Rosquilla | Muestra los 4 tipos de tipificación más frecuentes. Agrupa las conversaciones por su tipo de tipificación y muestra el conteo |
| **Mapa de calor** | Heatmap | Muestra concentración de mensajes recibidos (`direccion = 'in'`) por día y hora. Tiene 3 vistas: Semana (últimos 7 días, eje X = hora, eje Y = día de semana), Mes (últimos 31 días, eje Y = día del mes), Año (últimos 12 meses, eje Y = mes) |

### Charts de evolución (gráficas de área, año actual)

| Chart | Descripción en español |
|-------|----------------------|
| **Evolución embudo** | Muestra mes a mes (año actual) cuántos prospectos entraron a cada estado del embudo. Agrupa por mes y por nombre de estado |
| **Evolución scoring** | Muestra mes a mes cuántos prospectos fueron clasificados como frío, tibio y caliente. Se basa en la `fecha_registro` del prospecto |
| **Evolución abandonos** | Mes a mes, cuántos chats fueron abandonados vs activos. Misma lógica de 24 horas sin respuesta |
| **Evolución utilidad** | Mes a mes, distribución de satisfactorio sí/no/sin respuesta en interacciones |
| **Evolución asistencia** | Mes a mes, cuántos chats fueron atendidos por humano vs solo bot |
| **Evolución tipo conversación** | Mes a mes, distribución por tipo de tipificación |

### SQL principales

```sql
-- KPIs: cuenta leads, contactados e interesados en una sola consulta usando FILTER
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE p.fue_contactado = 1) as contactados,
  COUNT(*) FILTER (WHERE p.calificacion_lead IN ('tibio', 'caliente')) as interesados
FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa

-- Embudo por estado: LEFT JOIN para incluir estados sin prospectos
SELECT ep.nombre, ep.color, ep.orden, COUNT(p.id) as total
FROM estado_prospecto ep
LEFT JOIN prospecto p ON p.id_estado_prospecto = ep.id AND p.estado_registro = 1
GROUP BY ep.id, ep.nombre, ep.color, ep.orden ORDER BY ep.orden

-- Citados: cuenta prospectos únicos con al menos 1 cita
SELECT COUNT(DISTINCT c.id_prospecto) as total
FROM cita c INNER JOIN prospecto p ON p.id = c.id_prospecto

-- Lead Scoring: distribución de calificación en una sola consulta
SELECT
  COUNT(*) FILTER (WHERE p.calificacion_lead = 'frio' OR p.calificacion_lead IS NULL) as frio,
  COUNT(*) FILTER (WHERE p.calificacion_lead = 'tibio') as tibio,
  COUNT(*) FILTER (WHERE p.calificacion_lead = 'caliente') as caliente
FROM prospecto p

-- Abandonados: usa LATERAL JOIN para obtener último mensaje de cada chat
SELECT COUNT(*) as total_chats,
  COUNT(*) FILTER (WHERE sub.ultimo_dir = 'out' AND sub.edad > INTERVAL '24 hours') as abandonados,
  COUNT(*) FILTER (WHERE sub.ultimo_dir = 'in' OR sub.edad <= INTERVAL '24 hours') as activos
FROM (
  SELECT c.id, ultimo.direccion as ultimo_dir, NOW() - ultimo.fecha_hora as edad
  FROM chat c
  LEFT JOIN LATERAL (
    SELECT m.direccion, m.fecha_hora FROM mensaje m
    WHERE m.id_chat = c.id ORDER BY m.fecha_hora DESC LIMIT 1
  ) ultimo ON true
) sub

-- Utilidad: cuenta interacciones satisfactorias, no satisfactorias, y sin respuesta
SELECT
  COUNT(*) FILTER (WHERE i.satisfactorio = 1) as si,
  COUNT(*) FILTER (WHERE i.satisfactorio = 0) as no,
  COUNT(*) FILTER (WHERE i.satisfactorio IS NULL) as no_responde
FROM interaccion i

-- Asistencia humana: cuenta chats atendidos por humano vs solo bot
SELECT
  COUNT(*) FILTER (WHERE c.bot_activo = 0) as con_humano,
  COUNT(*) FILTER (WHERE c.bot_activo = 1) as solo_bot
FROM chat c

-- Tipo conversación: top 4 tipificaciones más frecuentes
SELECT COALESCE(t.tipo, 'Otros') as tipo, COUNT(*) as total
FROM tipificacion t GROUP BY t.tipo ORDER BY total DESC

-- Heatmap semana: cuenta mensajes recibidos agrupados por día de la semana y hora
SELECT EXTRACT(DOW FROM m.fecha_hora)::int as dia,
  EXTRACT(HOUR FROM m.fecha_hora)::int as hora, COUNT(*) as total
FROM mensaje m WHERE m.direccion = 'in'
AND m.fecha_hora >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dia, hora

-- KPIs mes anterior: misma consulta de KPIs pero con rango del mes pasado
-- Se usa para calcular el % de cambio (ej: +15% vs mes anterior)
SELECT COUNT(*) as total_leads, ... FROM prospecto p
WHERE p.fecha_registro >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
AND p.fecha_registro < DATE_TRUNC('month', CURRENT_DATE)
```

### Tablas que se consultan
- `prospecto` — Leads y sus calificaciones
- `estado_prospecto` — Estados del embudo
- `cita` — Citas agendadas
- `chat` — Conversaciones (incluye flag `bot_activo`)
- `mensaje` — Mensajes para heatmap
- `interaccion` — Registro de satisfacción
- `tipificacion` — Tipos de conversación

---

## 4. Reportes - Embudo de Ventas (`/reportes`)

**Endpoint**: `GET /funnel?idEmpresa={id}&dateFrom={fecha}&dateTo={fecha}`

### Métricas

| Métrica | Descripción en español |
|---------|----------------------|
| **Total Leads** | Conteo de todos los prospectos activos dentro del rango de fechas seleccionado |
| **Contactados** | De esos prospectos, cuántos tienen `fue_contactado = 1` (ya se les contactó) |
| **Interesados** | De esos prospectos, cuántos tienen calificación "tibio" o "caliente" |
| **% Conversión** | Porcentaje entre cada etapa. Ej: contactados/totalLeads, interesados/totalLeads |

### SQL

```sql
-- Total leads en rango de fechas
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa
AND p.fecha_registro >= :dateFrom AND p.fecha_registro <= :dateTo

-- Contactados en ese mismo rango
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa
AND p.fue_contactado = 1

-- Interesados (tibio o caliente) en ese mismo rango
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1 AND p.id_empresa = :idEmpresa
AND p.calificacion_lead IN ('tibio', 'caliente')
```

### Tablas que se consultan
- `prospecto`

---

## 5. Consumo de Mensajes (`/dashboard/consumo` - Tab Mensajes)

**Endpoint**: `GET /consumo?idEmpresa={id}&mes={YYYY-MM}`

### Concepto clave: "Conversación"
Una conversación se define como un chat-día único. Si un mismo chat tiene mensajes en 3 días distintos, cuenta como 3 conversaciones. Esto es para facturación.

### Métricas

| Métrica | Descripción en español |
|---------|----------------------|
| **Total mes** | Cantidad de conversaciones (combinaciones únicas de chat + día) en el mes seleccionado. Se usa `DISTINCT m.id_chat, DATE(m.fecha_hora)` |
| **Hoy** | Cantidad de chats distintos que tuvieron al menos un mensaje hoy |
| **Promedio/día** | Total de conversaciones del mes dividido entre la cantidad de días que tuvieron actividad |
| **vs Mes anterior** | Porcentaje de cambio comparado con el mismo cálculo del mes pasado. Ej: si este mes hay 200 y el anterior hubo 180, sube +11% |
| **Gráfica diaria** | Barras mostrando cantidad de conversaciones por cada día del mes |

### SQL

```sql
-- Total conversaciones del mes (chat-día distintos)
-- Un chat con mensajes en 3 días = 3 conversaciones
SELECT COUNT(*) as total FROM (
  SELECT DISTINCT m.id_chat, DATE(m.fecha_hora) as dia
  FROM mensaje m
  INNER JOIN chat c ON c.id = m.id_chat
  INNER JOIN prospecto p ON p.id = c.id_prospecto
  WHERE p.id_empresa = :idEmpresa
  AND m.fecha_hora >= :mesInicio AND m.fecha_hora < :mesFin
) sub

-- Conversaciones de hoy
SELECT COUNT(*) as total FROM (
  SELECT DISTINCT m.id_chat FROM mensaje m
  INNER JOIN chat c ON c.id = m.id_chat
  WHERE DATE(m.fecha_hora) = CURRENT_DATE
) sub

-- Desglose diario: barras por día
SELECT DATE(m.fecha_hora) as fecha,
  EXTRACT(DOW FROM DATE(m.fecha_hora))::int as dia_semana,
  COUNT(DISTINCT m.id_chat) as conversaciones
FROM mensaje m
INNER JOIN chat c ON c.id = m.id_chat
INNER JOIN prospecto p ON p.id = c.id_prospecto
WHERE p.id_empresa = :idEmpresa
GROUP BY DATE(m.fecha_hora) ORDER BY fecha
```

### Tablas que se consultan
- `mensaje` — Para contar mensajes por día
- `chat` — Para identificar conversaciones
- `prospecto` — Para filtrar por empresa

---

## 6. Consumo de Llamadas (`/dashboard/consumo` - Tab Llamadas)

**Endpoint**: `GET /consumo-llamadas?idEmpresa={id}&mes={YYYY-MM}`

### Concepto clave: "Minutos facturables"
Cada llamada se redondea al minuto: si el sobrante de segundos es >= 30, se redondea para arriba. Mínimo 1 minuto por llamada.

### Métricas

| Métrica | Descripción en español |
|---------|----------------------|
| **Total llamadas mes** | Conteo simple de todas las llamadas del mes |
| **Total minutos mes** | Suma de minutos facturables de todas las llamadas del mes (con la fórmula de redondeo) |
| **Llamadas hoy** | Conteo de llamadas realizadas hoy |
| **Minutos hoy** | Suma de minutos facturables de las llamadas de hoy |
| **Gráfica diaria** | Barras con cantidad de llamadas y minutos por cada día del mes |

### SQL (fórmula de minutos facturables)

```sql
-- Fórmula: duración en segundos → minutos facturables
-- Si el sobrante (segundos % 60) es >= 30 → redondea arriba
-- Mínimo 1 minuto por llamada
GREATEST(
  FLOOR(l.duracion_seg / 60) + CASE WHEN (l.duracion_seg % 60) >= 30 THEN 1 ELSE 0 END,
  1
)

-- Ejemplo: llamada de 95 segundos
-- FLOOR(95/60) = 1 minuto + (95%60=35 >= 30 → +1) = 2 minutos facturables

-- Total del mes
SELECT COUNT(*) as total_llamadas,
  COALESCE(SUM(GREATEST(FLOOR(l.duracion_seg/60) + CASE WHEN (l.duracion_seg%60)>=30 THEN 1 ELSE 0 END, 1)), 0) as total_minutos
FROM llamada l
WHERE l.id_empresa = :idEmpresa
AND l.fecha_inicio >= :mesInicio AND l.fecha_inicio < :mesFin

-- Desglose diario
SELECT DATE(l.fecha_inicio) as fecha,
  COUNT(*) as llamadas,
  COALESCE(SUM(GREATEST(...)), 0) as minutos
FROM llamada l
GROUP BY DATE(l.fecha_inicio) ORDER BY fecha
```

### Tablas que se consultan
- `llamada` — Registro de llamadas con duración en segundos
- `prospecto` — Para filtrar por empresa

---

## 7. Consumo Histórico - Tendencia (`/dashboard/consumo` - Gráfica inferior)

**Endpoint**: `GET /consumo-historico?idEmpresa={id}&tipo={mensajes|llamadas}&periodo={mes|anio|todo}`

### Descripción
Muestra una gráfica de línea/área con la tendencia mensual del consumo. Puede mostrar mensajes o llamadas según el tab seleccionado.

### Métricas

| Tipo | Descripción en español |
|------|----------------------|
| **Mensajes** | Cantidad de conversaciones (chat-día) agrupadas por mes. Muestra los últimos 12 meses |
| **Llamadas** | Cantidad de llamadas y minutos facturables agrupados por mes |

### SQL

```sql
-- Tendencia mensajes: conversaciones por mes (últimos 12 meses)
WITH meses AS (
  SELECT DATE_TRUNC('month', m.fecha_hora) AS fecha_mes,
    COUNT(DISTINCT (c.id || '-' || DATE(m.fecha_hora))) AS total
  FROM mensaje m
  JOIN chat c ON c.id = m.id_chat
  JOIN prospecto p ON p.id = c.id_prospecto
  WHERE p.id_empresa = :idEmpresa
  GROUP BY DATE_TRUNC('month', m.fecha_hora)
)
SELECT fecha_mes, total FROM meses
WHERE fecha_mes >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'

-- Tendencia llamadas: llamadas y minutos por mes
WITH meses AS (
  SELECT DATE_TRUNC('month', l.fecha_inicio) AS fecha_mes,
    COUNT(*) AS total_llamadas,
    SUM(GREATEST(FLOOR(l.duracion_seg/60) + CASE WHEN (l.duracion_seg%60)>=30 THEN 1 ELSE 0 END, 1)) AS total_minutos
  FROM llamada l WHERE l.id_empresa = :idEmpresa
  GROUP BY DATE_TRUNC('month', l.fecha_inicio)
)
SELECT * FROM meses ORDER BY fecha_mes
```

### Tablas que se consultan
- `mensaje`, `chat`, `prospecto` — Para tendencia de mensajes
- `llamada` — Para tendencia de llamadas

---

## 8. Automatización: Campañas WS (`/dashboard/automatizacion` - Tab Campañas)

**Endpoint**: `GET /automatizacion/campanas?idEmpresa={id}`

### Métricas del embudo

| Métrica | Descripción en español |
|---------|----------------------|
| **Envíos** | Conteo de prospectos únicos (`DISTINCT id_prospecto`) que fueron incluidos en ejecuciones de campañas que usan plantilla WhatsApp |
| **Vistos** | De los prospectos enviados, cuántos tienen un chat con al menos un mensaje con plantilla WhatsApp (indica que el mensaje les llegó) |
| **Respondidos** | De los prospectos enviados, cuántos tienen un mensaje de entrada (`direccion = 'in'`) con fecha posterior a la ejecución de la campaña (respondieron después de recibir la campaña) |
| **Desuscritos** | De los prospectos enviados, cuántos tienen un chat con `bot_activo = 0` (pidieron no recibir más mensajes o un asesor tuvo que intervenir) |
| **Embudo** | Visualización en funnel: Envíos → Vistos → Respondidos → Desuscritos |
| **Evolución mensual** | Gráfica de área mostrando estas métricas mes a mes durante el año actual |

### SQL

```sql
-- Embudo de campañas WhatsApp
SELECT
  -- Envíos: prospectos únicos en ejecuciones de campañas WS
  COUNT(DISTINCT cp.id_prospecto) as enviados,

  -- Vistos: tienen chat con mensaje de plantilla WS
  COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM chat ch
      INNER JOIN mensaje m ON m.id_chat = ch.id
      WHERE ch.id_prospecto = cp.id_prospecto
      AND m.id_plantilla_whatsapp IS NOT NULL
    ) THEN cp.id_prospecto
  END) as visualizados,

  -- Respondidos: tienen respuesta (mensaje IN) después de la ejecución
  COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM chat ch
      INNER JOIN mensaje m ON m.id_chat = ch.id
      WHERE ch.id_prospecto = cp.id_prospecto
      AND m.direccion = 'in' AND m.fecha_hora > ce.fecha_registro
    ) THEN cp.id_prospecto
  END) as respondidos,

  -- Desuscritos: tienen chat donde el bot fue desactivado
  COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM chat ch
      WHERE ch.id_prospecto = cp.id_prospecto AND ch.bot_activo = 0
    ) THEN cp.id_prospecto
  END) as desuscritos

FROM campania_prospectos cp
INNER JOIN campania_ejecucion ce ON ce.id = cp.id_campania_ejecucion
INNER JOIN campania ca ON ca.id = ce.id_campania
  AND ca.id_plantilla_whatsapp IS NOT NULL  -- Solo campañas WhatsApp
INNER JOIN prospecto p ON p.id = cp.id_prospecto
WHERE p.id_empresa = :idEmpresa
```

### Tablas que se consultan
- `campania_prospectos` — Qué prospectos están en cada ejecución
- `campania_ejecucion` — Cuándo se ejecutó cada campaña
- `campania` — Datos de la campaña (incluye plantilla WS)
- `prospecto` — Para filtrar por empresa
- `chat` — Para verificar si tienen conversación
- `mensaje` — Para verificar respuestas

---

## 9. Automatización: Recordatorios de Cita (`/dashboard/automatizacion` - Tab Recordatorios)

**Endpoint**: `GET /automatizacion/recordatorios?idEmpresa={id}`

### Métricas

| Métrica | Descripción en español |
|---------|----------------------|
| **Enviados** | Total de recordatorios registrados en la tabla `prospecto_recordatorio` |
| **Vistos** | Recordatorios donde el campo `cantidad > 0` (indica que se envió al menos un recordatorio efectivamente) |
| **Respondidos** | Prospectos únicos que tienen un mensaje de entrada (`direccion = 'in'`) con fecha posterior al recordatorio (respondieron después de recibirlo) |
| **Tasa reagendamiento** | Porcentaje de citas que fueron modificadas después de su creación (`fecha_actualizacion > fecha_registro`). Indica cuántas citas se reagendaron |
| **Embudo** | Enviados → Vistos → Respondidos |
| **Donut reagendamiento** | Gráfica circular: "Reagendadas" vs "Sin cambio" |
| **Evolución mensual** | Recordatorios y reagendamientos mes a mes |

### SQL

```sql
-- KPIs de recordatorios
SELECT
  COUNT(*) as enviados,                                    -- Total registros
  COUNT(*) FILTER (WHERE pr.cantidad > 0) as visualizados, -- Con envío efectivo
  COUNT(DISTINCT CASE                                       -- Con respuesta posterior
    WHEN EXISTS (
      SELECT 1 FROM chat ch
      INNER JOIN mensaje m ON m.id_chat = ch.id
      WHERE ch.id_prospecto = pr.id_prospecto
      AND m.direccion = 'in' AND m.fecha_hora > pr.fecha_registro
    ) THEN pr.id_prospecto
  END) as respondidos
FROM prospecto_recordatorio pr
INNER JOIN prospecto p ON p.id = pr.id_prospecto
WHERE p.id_empresa = :idEmpresa

-- Reagendamiento de citas
SELECT
  COUNT(*) as total_citas,
  COUNT(*) FILTER (WHERE c.fecha_actualizacion > c.fecha_registro) as reagendadas
FROM cita c
INNER JOIN prospecto p ON p.id = c.id_prospecto
WHERE p.id_empresa = :idEmpresa
```

### Tablas que se consultan
- `prospecto_recordatorio` — Registros de recordatorios enviados
- `prospecto` — Para filtrar por empresa
- `cita` — Para calcular reagendamiento
- `chat`, `mensaje` — Para verificar respuestas

---

## 10. Automatización: Recuperación (`/dashboard/automatizacion` - Tab Recuperación)

**Endpoint**: `GET /automatizacion/recuperacion?idEmpresa={id}`

### Concepto clave: "Chat abandonado"
Un chat se considera abandonado cuando su último mensaje es de salida (`direccion = 'out'`) y han pasado más de 24 horas sin respuesta del prospecto.

### Métricas

| Métrica | Descripción en español |
|---------|----------------------|
| **Enviados** | Cantidad de chats abandonados (último mensaje es de salida y tiene más de 24 horas de antigüedad) |
| **Vistos** | De los chats abandonados, cuántos tienen un mensaje de recuperación (mensaje de salida enviado dentro de la hora previa al abandono) |
| **Respondidos** | De los chats abandonados, cuántos recibieron una respuesta del prospecto (`direccion = 'in'`) después del último mensaje de salida |
| **Embudo** | Enviados → Vistos → Respondidos |
| **Evolución mensual** | Métricas de recuperación mes a mes durante el año actual |

### SQL

```sql
-- CTE: identifica chats abandonados (último msg es OUT y tiene >24h)
WITH chats_abandonados AS (
  SELECT c.id, c.id_prospecto, ultimo.fecha_hora as fecha_ultimo_out
  FROM chat c
  INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
  LEFT JOIN LATERAL (
    SELECT m.direccion, m.fecha_hora FROM mensaje m
    WHERE m.id_chat = c.id AND m.estado_registro = 1
    ORDER BY m.fecha_hora DESC LIMIT 1
  ) ultimo ON true
  WHERE c.estado_registro = 1
  AND ultimo.direccion = 'out'
  AND NOW() - ultimo.fecha_hora > INTERVAL '24 hours'
  AND p.id_empresa = :idEmpresa
)

SELECT
  -- Enviados: total de chats abandonados
  (SELECT COUNT(*) FROM chats_abandonados) as enviados,

  -- Vistos: chats con mensaje de recuperación (out cercano al abandono)
  (SELECT COUNT(*) FROM chats_abandonados ca
   WHERE EXISTS (
     SELECT 1 FROM mensaje m WHERE m.id_chat = ca.id
     AND m.direccion = 'out'
     AND m.fecha_hora > ca.fecha_ultimo_out - INTERVAL '1 hour'
   )
  ) as visualizados,

  -- Respondidos: chats donde el prospecto respondió después del abandono
  (SELECT COUNT(*) FROM chats_abandonados ca
   WHERE EXISTS (
     SELECT 1 FROM mensaje m WHERE m.id_chat = ca.id
     AND m.direccion = 'in'
     AND m.fecha_hora > ca.fecha_ultimo_out
   )
  ) as respondidos
```

### Tablas que se consultan
- `chat` — Conversaciones y su estado
- `mensaje` — Para determinar último mensaje y respuestas
- `prospecto` — Para filtrar por empresa

---

## 11. Campañas WhatsApp con Estadísticas

**Endpoint**: `GET /whatsapp-campanas?idEmpresa={id}`

### Descripción
Lista todas las campañas WhatsApp de la empresa con sus estadísticas de envío. Se usa principalmente en la sección de campañas del dashboard.

### Datos por campaña

| Dato | Descripción en español |
|------|----------------------|
| **Nombre** | Nombre de la campaña |
| **Plantilla WS** | Nombre de la plantilla WhatsApp usada |
| **Plantilla IA** | Nombre de la plantilla de IA/bot asociada |
| **Estado** | Estado de la campaña (del catálogo `estado_campania`) |
| **Fecha programada** | Cuándo se programó la ejecución |
| **Enviados** | Conteo de prospectos únicos que fueron asignados a ejecuciones de esta campaña |
| **Entregados** | De los enviados, cuántos tienen un chat con al menos un mensaje de salida (confirma que se les envió algo) |

### SQL

```sql
SELECT ca.id, ca.nombre, ca.descripcion,
  pw.name as plantilla_whatsapp_nombre,
  pi2.nombre as plantilla_ia_nombre,
  COALESCE(ec.nombre, 'Sin estado') as estado,
  ce.fecha_programada, ce.fecha_inicio, ce.fecha_fin,
  COALESCE(stats.total_enviados, 0) as enviados,
  COALESCE(stats.total_entregados, 0) as entregados
FROM campania ca
LEFT JOIN plantilla_whatsapp pw ON pw.id = ca.id_plantilla_whatsapp
LEFT JOIN plantilla pi2 ON pi2.id = ca.id_plantilla
LEFT JOIN estado_campania ec ON ec.id = ca.id_estado_campania
-- Última ejecución de la campaña
LEFT JOIN LATERAL (
  SELECT ce2.* FROM campania_ejecucion ce2
  WHERE ce2.id_campania = ca.id ORDER BY ce2.fecha_registro DESC LIMIT 1
) ce ON true
-- Estadísticas de envío
LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT cp.id_prospecto) as total_enviados,
    COUNT(DISTINCT CASE
      WHEN EXISTS (SELECT 1 FROM chat ch
        INNER JOIN mensaje m ON m.id_chat = ch.id AND m.direccion = 'out'
        WHERE ch.id_prospecto = cp.id_prospecto
      ) THEN cp.id_prospecto
    END) as total_entregados
  FROM campania_ejecucion ce3
  INNER JOIN campania_prospectos cp ON cp.id_campania_ejecucion = ce3.id
  WHERE ce3.id_campania = ca.id
) stats ON true
WHERE ca.estado_registro = 1 AND ca.id_empresa = :idEmpresa
ORDER BY ca.fecha_registro DESC
```

### Tablas que se consultan
- `campania` — Datos de la campaña
- `plantilla_whatsapp` — Plantilla WS usada
- `plantilla` — Plantilla de IA/bot
- `estado_campania` — Catálogo de estados
- `campania_ejecucion` — Ejecuciones (fechas)
- `campania_prospectos` — Prospectos asignados
- `chat`, `mensaje` — Para confirmar entrega

---

## 12. Segmentación de Prospectos

**Endpoint**: `GET /automatizacion/segmentar?idEmpresa={id}&estado={ids}&scoring={vals}&contactado={0|1}&actividad={tipo}`

### Descripción
Permite filtrar prospectos por múltiples criterios combinados. Se usa para crear segmentos antes de enviar campañas.

### Filtros disponibles

| Filtro | Descripción en español |
|--------|----------------------|
| **estado** | IDs de estados del prospecto (ej: `1,2,3`). Filtra por `id_estado_prospecto IN (...)` |
| **scoring** | Valores de calificación (ej: `frio,tibio`). Filtra por `calificacion_lead IN (...)` |
| **contactado** | `0` o `1`. Filtra por `fue_contactado = :contactado` |
| **actividad** | Tipo de actividad: `abandonados` (último msg out >24h), `sin_respuesta` (tienen chat sin msg in), `sin_chat` (no tienen chat) |

### Resultado

| Dato | Descripción |
|------|-------------|
| **total** | Cantidad de prospectos que coinciden con todos los filtros |
| **prospectos** | Lista de máximo 100 prospectos con: id, nombre, celular, email, calificación, estado |

### SQL

```sql
-- Conteo de prospectos que cumplen todos los filtros
SELECT COUNT(*) as total FROM prospecto p
WHERE p.estado_registro = 1
  AND p.id_empresa = :idEmpresa
  AND p.id_estado_prospecto IN (:estados)      -- filtro estado
  AND p.calificacion_lead IN (:scorings)        -- filtro scoring
  AND p.fue_contactado = :contactado            -- filtro contactado
  AND (filtro_actividad con EXISTS/NOT EXISTS)   -- filtro actividad

-- Lista de prospectos (máximo 100)
SELECT p.id, p.nombre_completo, p.celular, p.email,
  p.calificacion_lead, ep.nombre as estado_nombre
FROM prospecto p
LEFT JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
WHERE (mismos filtros)
ORDER BY p.fecha_registro DESC LIMIT 100
```

### Tablas que se consultan
- `prospecto` — Datos del lead
- `estado_prospecto` — Nombre del estado
- `chat`, `mensaje` — Para filtros de actividad

---

## 13. Speech Analytics (`/dashboard/speech-analytics`)

**Endpoint**: NINGUNO — Usa datos mock (falsos) en el frontend

### Descripción
Esta sección NO se conecta al backend. Todos los datos están hardcodeados (escritos a mano) directamente en el código del frontend. Son datos de ejemplo estáticos.

### Charts con datos estáticos

| Chart | Datos mock |
|-------|-----------|
| **Promedio conv/hora** | Barras horizontales con valores fijos (24h/48h/72h) |
| **FCR (First Call Resolution)** | Donut que siempre muestra 70% resueltas |
| **Evolución FCR** | Línea mensual con valores entre 60-75% |
| **Sentimiento** | Donut con 33%/33%/33% (positivo/neutro/negativo) |
| **Emociones** | Donut con frustración, enojo, satisfacción, etc. |
| **Preguntas frecuentes** | Top 8 preguntas fijas |
| **Temas frecuentes** | Top 8 temas fijos |
| **Word Cloud** | Palabras flotantes fijas (Ayuda, Compra, etc.) |

### Tablas que se consultan
**Ninguna** — Todos los datos son estáticos en el frontend

---

## Resumen: Tablas usadas por cada Dashboard

| Tabla | Dónde se usa |
|-------|-------------|
| `prospecto` | TODOS los dashboards (es la tabla central) |
| `estado_prospecto` | Dashboard General, WhatsApp, Resumen, Segmentación |
| `mensaje` | WhatsApp, Resumen (heatmap), Consumo, todas las Automatizaciones |
| `chat` | WhatsApp, Resumen (abandonados, asistencia), Consumo, Automatizaciones |
| `cita` | Resumen (citados), Recordatorios (reagendamiento) |
| `interaccion` | Resumen (utilidad de información) |
| `tipificacion` | Resumen (tipo de conversación) |
| `campania` | WhatsApp, Automatización Campañas |
| `campania_ejecucion` | WhatsApp, Automatización Campañas |
| `campania_prospectos` | WhatsApp, Automatización Campañas |
| `plantilla_whatsapp` | WhatsApp (rendimiento de plantillas) |
| `plantilla` | Campañas WS (plantilla IA asociada) |
| `estado_campania` | Campañas WS (catálogo de estados) |
| `prospecto_recordatorio` | Recordatorios de cita |
| `llamada` | Consumo de llamadas |

## Patrones SQL avanzados que se usan

| Patrón | Para qué sirve |
|--------|---------------|
| **LATERAL JOIN** | Obtener el último mensaje de cada chat o la última ejecución de cada campaña (evita subconsultas correlacionadas lentas) |
| **FILTER (WHERE ...)** | Hacer conteos condicionales en una sola consulta. Ej: `COUNT(*) FILTER (WHERE direccion = 'in')` cuenta solo mensajes de entrada |
| **CTE (WITH ... AS)** | Definir subconsultas reutilizables. Ej: `chats_validos` se define una vez y se usa en múltiples consultas |
| **EXISTS** | Verificar si existe una relación sin traer datos. Ej: "¿este prospecto tiene un chat con respuesta?" |
| **EXTRACT** | Extraer partes de fechas. Ej: `EXTRACT(HOUR FROM fecha)` para el heatmap por hora |
| **DATE_TRUNC** | Agrupar por períodos. Ej: `DATE_TRUNC('month', fecha)` para evolución mensual |
| **Promise.all** | En el backend, ejecuta múltiples consultas SQL en paralelo para mejor rendimiento |
