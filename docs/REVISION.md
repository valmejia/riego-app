# Revisión de fallos — Hydra Cloud

Leyenda: ✅ corregido en este cambio · ⚠️ requiere acción tuya (fuera del repo).

## 1. Seguridad

| # | Problema | Estado |
|---|---|---|
| S1 | `server/.env` (MONGO_URI con contraseña y API_TOKEN) estaba versionado. | ✅ Quitado del índice, añadido `.gitignore` y `.env.example`. ⚠️ **Sigue en el historial de git: cambia la contraseña de MongoDB Atlas y el API_TOKEN.** |
| S2 | `server/node_modules` (1540 archivos) estaba versionado. | ✅ Quitado del repo. |
| S3 | `/comandos/pendiente` y `/completar/:id` abiertos: cualquiera con la URL de ngrok podía marcar órdenes como hechas. | ✅ `DEVICE_TOKEN` opcional (actívalo cuando actualices el sketch). |
| S4 | Comparación del token con `!==` (vulnerable a ataques de tiempo) y sin aviso si falta `API_TOKEN`. | ✅ `crypto.timingSafeEqual` y fallo cerrado. |
| S5 | `cors()` abierto a cualquier origen. | ✅ Configurable con `CORS_ORIGIN`. |
| S6 | Los errores devolvían `err.message` de Mongo al cliente. | ✅ Mensajes genéricos; el detalle queda en el log. |
| S7 | El webhook de GreenBot es público: cualquiera puede gastar tu cuota de Groq. | ⚠️ En Make añade un filtro de longitud y limita ejecuciones; no publiques el panel con el webhook sin protección. |

## 2. Backend

| # | Problema | Estado |
|---|---|---|
| B1 | **Órdenes acumuladas**: si el Arduino pasaba horas sin conexión, al volver ejecutaba todos los "regar" en cola uno tras otro → maceta encharcada. | ✅ Caducan tras `COMANDO_TTL_MIN` (10 min), no se apilan riegos duplicados y "detener" cancela los pendientes y tiene prioridad. |
| B2 | `accion` aceptaba cualquier texto (`"borrar"`, etc.). | ✅ Solo `regar`/`detener`; `duracion` 1-120 s. |
| B3 | `POST /api/humedad` sin validar: `humedad: "abc"` o `NaN` del DHT22 → error 500. | ✅ Valida 0-100, convierte `NaN`/`"nan"` a `null`. |
| B4 | `/completar/:id` con id inválido → 500; con id inexistente → `ok: true`. | ✅ 400 / 404. |
| B5 | Sin índice en `{device_id, timestamp}`: cada consulta del panel recorría toda la colección. | ✅ Índice añadido. |
| B6 | Si `PORT` faltaba, `app.listen(undefined)` usaba un puerto aleatorio y el proxy de Vite (5000) fallaba. | ✅ Puerto por defecto 5000. |
| B7 | Si MongoDB fallaba, el proceso seguía vivo sin servir nada. | ✅ Sale con código 1 (útil con pm2/nodemon). |
| B8 | No había historial, configuración del modo ni registro de órdenes. | ✅ `/historial`, `/dispositivos`, `/comandos/recientes`, `/api/health`. |

## 3. Frontend

| # | Problema | Estado |
|---|---|---|
| F1 | El botón "Dar un poco de agua" y "Pasar a Manual" solo cambiaban un estado local: **no hacían nada en la maceta**. | ✅ Envían órdenes reales a la API (con token). |
| F2 | "Conectado" y "ESP32-WROOM" escritos a mano: el panel decía conectado aunque el Arduino estuviera apagado. | ✅ Estado real según la antigüedad de la última lectura (>3 min = sin señal). |
| F3 | `useHumedad` se llamaba dos veces (App y Dashboard) → el doble de peticiones. | ✅ Una sola consulta compartida; se pausa con la pestaña oculta. |
| F4 | `loading` no existía en el hook; un error borraba todo el panel. | ✅ Se conserva el último dato y se muestra un aviso. |
| F5 | No se revisaba `res.ok`; la página HTML de aviso de ngrok rompía `res.json()`. | ✅ Cabecera `ngrok-skip-browser-warning` y mensajes claros. |
| F6 | Mín./máx. "18 °C / 29 °C", "Agradable", "Fresco y templado" eran fijos. | ✅ Calculados con los datos. |
| F7 | Enlaces Historial/Consejos sin destino; `AdviceCard` sin usar. | ✅ Secciones reales. |
| F8 | `--radius-full: 0.75rem` hacía que `rounded-full` no fuera circular. | ✅ Token `rounded-pill` para círculos. |
| F9 | Barras de desplazamiento ocultas globalmente: no se veía que había más contenido. | ✅ Barras finas visibles. |
| F10 | `lang="en"`, título "client", restos de la plantilla de Vite. | ✅ Limpiado. |

## 4. Arduino (`arduino/hydra_cloud/hydra_cloud.ino`)

| # | Problema en el sketch anterior | Estado |
|---|---|---|
| A1 | **Nunca consultaba `/api/comandos/pendiente`**: "Regar ahora" del panel y las órdenes de GreenBot no llegaban a la maceta. | ✅ Consulta cada 10 s (cada 3 s mientras riega). |
| A2 | Modo manual inexistente en el Arduino: siempre obedecía a Make. | ✅ Lee `modo` y `umbral` de `/pendiente`; en manual ignora el riego automático. |
| A3 | Riego con `delay()` de hasta 30 s: imposible detenerlo. | ✅ Riego no bloqueante; "Detener" corta la bomba en ≤ 3 s. |
| A4 | Make podía ordenar riego cada 30 s mientras el agua todavía no llegaba al sensor → encharcamiento. | ✅ 10 min de absorción entre riegos automáticos (el riego manual no espera). |
| A5 | Si el HW-080 se suelta, la lectura queda en "seco" y regaba sin parar. | ✅ Lectura fuera de 300–4090 = sensor en error, no riega en automático. |
| A6 | `pinMode` antes de `digitalWrite(HIGH)`: pulso breve del relé al arrancar. | ✅ Orden invertido. |
| A7 | WiFi, contraseña y URL del webhook escritos en el código. | ✅ Movidos a `arduino_secrets.h` (ignorado por git). ⚠️ **Ya los compartiste: cambia la contraseña del WiFi y regenera el webhook de Make.** |
| A8 | Reconexión WiFi con `delay(3000)` en cada vuelta. | ✅ Reintento no bloqueante cada 15 s. |
| A9 | Si fallaba la confirmación de una orden, se volvía a ejecutar. | ✅ Se recuerda el último id ejecutado. |

Lo que ya estaba bien: `analogReadResolution(12)` coincide con tu calibración, el DHT22 envía `null` si falla y ya había un tope de 30 s por riego.

Pendiente de hardware (⚠️):
- **HW-080 se corroe** si está alimentado siempre: alimenta su VCC desde un pin digital y enciéndelo solo al medir.
- **Bomba con fuente propia**, GND común con el Arduino; nunca desde el pin 5 V.
- **Sensor de nivel/flotador** en el depósito para no hacer trabajar la bomba en seco.
- **ngrok con dominio estático** (`ngrok http --url=TU-DOMINIO.ngrok-free.app 5000`): el Arduino guarda el dominio en `SECRET_API_HOST`.

## 5. Make / GreenBot

### Escenario de telemetría (Arduino → Make)
El Arduino ahora envía además `modo`, `umbral` y `sensor_ok`:
```json
{"device_id":"maceta1","humedad":42,"raw":2870,"temp":22.4,"hum_amb":61.0,"modo":"auto","umbral":30,"sensor_ok":true}
```
- En el filtro de decisión, cambia el umbral fijo por `{{umbral}}` y añade la condición `sensor_ok = true`.
- Al reenviar a la API (`POST /api/humedad`) mapea `temp → temperatura` y `hum_amb → humedad_ambiental` como hasta ahora.

### Escenario de GreenBot (panel → Make)
El panel envía (el widget `greenbot-widget.js` manda lo mismo pero sin `context`):
```json
{ "device_id": "maceta1", "messages": [...], "context": { "planta": "...", "humedad_suelo": 44, ... } }
```
- **`device_id` en la raíz** identifica la maceta de la que se habla. Para tener datos frescos aunque el bot se use fuera del panel, añade antes de Groq un módulo HTTP `GET https://TU-DOMINIO.ngrok-free.app/api/humedad/{{1.device_id}}` (cabecera `ngrok-skip-browser-warning: 1`) y usa ese resultado en el system prompt.
- **Prompt sugerido:** `Eres GreenBot, asistente de Hydra Cloud. Hablas de la maceta {{1.device_id}} ({{1.context.planta}}). Datos actuales: suelo {{1.context.humedad_suelo}}%, aire {{1.context.temperatura}} °C / {{1.context.humedad_aire}}%, bomba encendida: {{1.context.bomba_encendida}}, modo {{1.context.modo}}, umbral {{1.context.umbral_riego}}%, Arduino en línea: {{1.context.arduino_en_linea}}.`
- Si GreenBot debe poder regar, que Make haga `POST /api/comandos` con `{"device_id":"{{1.device_id}}","accion":"regar","duracion":20,"origen":"greenbot"}` y `Authorization: Bearer API_TOKEN`.
- **JSON roto en Webhook response**: arma la respuesta con *JSON → Create JSON* en lugar de `{"reply":"{{texto}}"}`. El panel lo tolera, pero es frágil.
- **Memoria**: el panel y el widget envían `transcript` ("Usuario: …\nAsistente: …"). Mapéalo en el módulo de Groq y sube `VITE_GREENBOT_HISTORY` / `data-history` a 6 para que recuerde la conversación.
- **Webhook público**: limita ejecuciones en Make para que nadie gaste tu cuota de Groq.
