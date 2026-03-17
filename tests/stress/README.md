# Pruebas de Estrés - Bot Vera (VIVA Inmobiliaria)

## Arquitectura

```
k6 (test-bot.js)                    stress-server.js (:3099)
  │                                        │
  │  Paso 1: "Hola"          ──POST──>    Vera: saludo
  │  Paso 2: "Mi nombre es Diego" ──>     Vera: pide proyecto/lugar
  │  Paso 3: "Vivienda propia"    ──>     Vera: pide distrito
  │  Paso 4: "San Isidro"         ──>     Vera: informa proyectos + pide autorización
  │  Paso 5: "Ok"                 ──>     Vera: confirma derivación
  │  Paso 6: "Gracias"            ──>     Vera: cierre
  │                                        │
  │                                 ┌──────┼──────┐
  │                                 │      │      │
  │                              BD Real  Mock   Mock
  │                             (queries)  LLM    WA
```

Cada **usuario virtual (VU)** simula **una conversación completa** del funnel (6 mensajes).
Con 50 VUs simultáneos = 50 conversaciones en paralelo = ~300 mensajes en tránsito.

## Modos de operación

### Modo SYNC (por defecto) - Latencia real
k6 envía `?sync=true` y el servidor espera a que termine el procesamiento completo antes de responder. k6 mide la **latencia real** del pipeline (BD + LLM + WA).

### Modo ASYNC (legacy) - Solo HTTP
El servidor responde `200` inmediatamente y procesa en background. k6 solo mide la latencia HTTP (~0.1ms). Usar con `-e SYNC=false`.

## Requisitos

```bash
# Instalar k6
choco install k6       # Windows (chocolatey)
winget install k6      # Windows (winget)
```

## Uso rápido

### Terminal 1: Servidor de pruebas

```bash
cd viva-api
node tests/stress/stress-server.js
```

### Terminal 2: k6

```bash
cd viva-api/tests/stress

# Modo sync (recomendado) - mide latencia real
k6 run test-bot.js

# Modo async (legacy)
k6 run -e SYNC=false test-bot.js

# Con chaos testing (payloads malformados)
k6 run -e CHAOS=true test-bot.js

# Con otra empresa
k6 run -e ID_EMPRESA=2 test-bot.js

# Prueba corta para verificar
k6 run --duration 1m --vus 5 test-bot.js
```

## Métricas

### Métricas k6 (modo sync)

| Métrica | Qué mide |
|---------|----------|
| `http_req_duration` | Latencia real end-to-end (BD + LLM + WA) |
| `server_total_duration` | Tiempo total reportado por el servidor |
| `server_db_duration` | Tiempo de queries a la base de datos |
| `server_llm_duration` | Latencia del LLM (mock) |
| `server_wa_duration` | Tiempo de envío WhatsApp (mock) |
| `paso_*_duration` | Latencia por paso del funnel |
| `conversaciones_completadas` | Funnels completos |
| `errors` | Tasa de errores |

### Métricas del servidor

| Sección | Qué indica |
|---------|------------|
| `latencia_inferencia` | Percentiles de tiempo total de procesamiento |
| `latencia_dependencias` | Desglose BD / LLM / WA |
| `pool_conexiones` | Uso del pool de conexiones PostgreSQL (size, using, available, waiting) |
| `ventana_60s` | Métricas de los últimos 60 segundos (tendencia final) |
| `estabilidad_concurrencia` | Ratio de degradación alta/baja carga |
| `funnel_conversacional` | Conteo y latencia por paso |
| `rendimiento_tokens` | Throughput simulado del LLM |

## Criterios de éxito

### 1. Latencia de inferencia
Tiempo total de respuesta del bot (BD + LLM + WA).

| Criterio | Umbral |
|----------|--------|
| p95 saludo (prompt corto) | < 1500ms |
| p95 autorización (prompt largo) | < 2000ms |
| p99 general | < 5000ms |

### 2. Rendimiento de tokens

| Métrica | Qué indica |
|---------|------------|
| `tokens_por_segundo_avg` | Throughput promedio del LLM |
| `tokens_prompt_total` | Crece con pasos avanzados del funnel (más historial) |
| `tokens_completion_total` | Relativamente constante por paso |

### 3. Estabilidad de concurrencia

| Evaluación | Ratio alta/baja carga | Significado |
|------------|----------------------|-------------|
| EXCELENTE | < 1.5x | Escala linealmente |
| BUENA | < 2.5x | Incremento aceptable |
| REGULAR | < 5x | Cuello de botella visible |
| MALA | >= 5x | Latencia exponencial, hay un problema |

### 4. Pool de conexiones BD

| Métrica | Qué vigilar |
|---------|-------------|
| `waiting > 0` | Requests esperando conexión = pool saturado |
| `using` cercano a `max` | Pool casi lleno, aumentar `max` o optimizar queries |
| `available = 0` | Todas las conexiones en uso |

### 5. Validación de contenido (modo sync)
k6 valida que la respuesta del bot contiene keywords esperadas por paso:
- Saludo: "Vera", "VIVA", "ayudar"
- Nombre: incluye el nombre del usuario
- Distrito: "autorización", "Acacias", "Lirios"
- Autorización: "derivando", incluye el distrito

## Chaos testing

Con `-e CHAOS=true`, se ejecuta un segundo escenario que envía payloads malformados:
- Phone faltante o demasiado largo
- Question vacía o de 10KB
- Body vacío
- id_empresa inválido
- Caracteres especiales y emojis

**Criterio:** El servidor no debe crashear. Todos los payloads deben recibir una respuesta válida (200 o 400).

## Endpoints del servidor

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/stress-test/message` | Procesa mensaje (async) |
| POST | `/api/stress-test/message?sync=true` | Procesa mensaje (sync, retorna timing) |
| GET | `/api/stress-test/metrics` | Métricas completas (JSON) |
| GET | `/api/stress-test/pool` | Estado del pool de conexiones BD |
| POST | `/api/stress-test/reset` | Resetea métricas y conversaciones |
| GET | `/health` | Health check |

## Consultar métricas en tiempo real

```bash
# Durante la prueba, en otra terminal:
curl http://localhost:3099/api/stress-test/metrics | jq .

# Solo latencia de dependencias:
curl http://localhost:3099/api/stress-test/metrics | jq .latencia_dependencias

# Solo el funnel:
curl http://localhost:3099/api/stress-test/metrics | jq .funnel_conversacional

# Estabilidad de concurrencia:
curl http://localhost:3099/api/stress-test/metrics | jq .estabilidad_concurrencia

# Pool de conexiones:
curl http://localhost:3099/api/stress-test/pool | jq .

# Ventana últimos 60s:
curl http://localhost:3099/api/stress-test/metrics | jq .ventana_60s
```

## Visualización con Grafana + InfluxDB

### 1. Levantar InfluxDB + Grafana

```bash
docker run -d --name influxdb -p 8086:8086 influxdb:1.8
docker run -d --name grafana -p 3001:3000 grafana/grafana
```

### 2. Ejecutar k6 enviando a InfluxDB

```bash
k6 run --out influxdb=http://localhost:8086/k6 test-bot.js
```

### 3. Configurar Grafana

1. Abrir http://localhost:3001 (admin/admin)
2. Data Source -> InfluxDB -> URL: http://localhost:8086 -> Database: k6
3. Importar dashboard ID **2587** (oficial de k6)

Las métricas custom aparecerán como:
- `paso_saludo_duration`, `paso_nombre_duration`, etc.
- `server_total_duration`, `server_db_duration`, `server_llm_duration`
- `conversaciones_completadas`, `mensajes_totales_enviados`
- `chaos_total_requests`, `chaos_handled`

## Escenarios de carga

```
VUs (conversaciones simultáneas)
 100 |                              ████
  80 |                        ██████
  60 |              ██████████
  40 |        ██████                  ██
  20 |  ██████                          ██
   0 |██                                  ██
     0    2    5    8   10   12   14   15 min
```

Cada VU envía 6 mensajes (funnel completo) con pausas realistas entre cada uno.

## Limpieza de datos

```bash
# Ver qué se borraría (sin cambios)
node tests/stress/cleanup-stress-data.js --dry-run

# Soft delete (estado_registro = 0)
node tests/stress/cleanup-stress-data.js

# Hard delete (DELETE real)
node tests/stress/cleanup-stress-data.js --hard
```

## Ajustar simulación del LLM

En `stress-server.js`, cada paso del flujo tiene `latencia_base` configurable:

```javascript
// Paso con prompt corto (150 tokens) → respuesta rápida
saludo: { latencia_base: 300 }

// Paso con prompt largo (1200 tokens) → respuesta más lenta
autorizacion: { latencia_base: 500 }
```

Para simular condiciones más realistas de OpenAI, multiplica las latencias base.
