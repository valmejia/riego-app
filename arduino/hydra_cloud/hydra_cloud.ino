/*
 * Hydra Cloud — maceta inteligente (Arduino UNO R4 WiFi)
 *
 * Sensores: HW-080 (suelo, A1) · DHT22 (aire, D2) · OLED SSD1306 (I2C)
 * Actuador: relé SRD-05VDC activo en LOW (D7) → bomba
 *
 * Flujo:
 *   cada 30 s  → POST a Make con la telemetría; Make decide {riego, duracion_seg}
 *                y reenvía la lectura a la API (/api/humedad).
 *   cada 10 s  → GET  {API}/api/comandos/pendiente?device_id=...
 *                trae órdenes del panel/GreenBot ("regar"/"detener") + modo + umbral.
 *
 * Cambios respecto a la versión anterior:
 *   - Consulta las órdenes del panel (antes "Regar ahora" nunca llegaba a la maceta).
 *   - Respeta el modo manual: en manual ignora la decisión automática de Make.
 *   - Riego NO bloqueante: se puede detener desde el panel en medio del riego.
 *   - Informa el estado real de la bomba en cada consulta (?bomba=1&restante=N).
 *   - Tiempo de absorción configurable entre riegos automáticos (0 = pruebas).
 *   - No riega en automático si la lectura del HW-080 es imposible (sensor suelto).
 *   - Relé en HIGH antes de configurarlo como salida (sin pulso al arrancar).
 *   - Credenciales fuera del código (arduino_secrets.h).
 *
 * Librerías: WiFiS3 (incluida con el core UNO R4), ArduinoJson 6/7,
 *            Adafruit GFX, Adafruit SSD1306, DHT sensor library (Adafruit).
 */
#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include "arduino_secrets.h"

// ---------- CONFIGURACIÓN ----------
const char* WIFI_SSID     = SECRET_WIFI_SSID;
const char* WIFI_PASSWORD = SECRET_WIFI_PASSWORD;
const char* MAKE_HOST     = SECRET_MAKE_HOST;
const char* MAKE_PATH     = SECRET_MAKE_PATH;
const char* API_HOST      = SECRET_API_HOST;
const char* DEVICE_TOKEN  = SECRET_DEVICE_TOKEN;
const char* DEVICE_ID     = "maceta1";

// Conexión del Arduino con la API (ngrok):
//   false → HTTP puerto 80. Funciona aunque el módulo WiFi no acepte el certificado
//           de ngrok. Arranca ngrok con:  ngrok http 5000 --url=TU-DOMINIO --scheme http,https
//   true  → HTTPS puerto 443 (requiere que el certificado de ngrok sea aceptado).
const bool API_HTTPS = false;

// ---------- PINES ----------
#define RELAY_PIN 7
#define SOIL_PIN  A1
#define DHTPIN    2
#define DHTTYPE   DHT22

// Calibración del HW-080 con analogReadResolution(12)
#define RAW_SECO   4065
#define RAW_MOJADO 1200
// Fuera de este rango la lectura no es física: cable suelto o corto.
#define RAW_MIN_VALIDO 300
#define RAW_MAX_VALIDO 4090

const int RELE_ACTIVO   = LOW;
const int RELE_INACTIVO = HIGH;

// ---------- TIEMPOS ----------
const unsigned long INTERVALO_TELEMETRIA = 30000UL;      // Make
const unsigned long INTERVALO_COMANDOS   = 10000UL;      // API: órdenes del panel
const unsigned long INTERVALO_COMANDOS_REGANDO = 3000UL; // más rápido para "detener"
const unsigned long INTERVALO_SENSORES   = 2000UL;       // DHT22: mínimo 2 s
// Espera tras un riego automático para que el agua llegue al sensor.
// En 0 para PRUEBAS (Make puede volver a regar en el siguiente ciclo).
// Para uso normal ponlo en 10UL * 60UL * 1000UL (10 minutos).
const unsigned long ABSORCION_MS         = 0UL;
const int           RIEGO_MAX_SEG        = 30;           // tope de seguridad por riego

// ---------- PANTALLA OLED ----------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
DHT dht(DHTPIN, DHTTYPE);

WiFiSSLClient clientMake;
WiFiSSLClient clientApi;       // API por HTTPS
WiFiClient    clientApiPlano;  // API por HTTP (API_HTTPS = false)

// ---------- ESTADO ----------
int   humedadSuelo = 0;
int   soilRaw      = 0;
float temp         = NAN;
float humAmbiente  = NAN;
bool  sensorSueloOk = true;

String modo   = "auto";   // lo dicta el panel vía /pendiente
int    umbral = 30;

bool          bombaEncendida = false;
unsigned long bombaInicio    = 0;
unsigned long bombaDuracionMs = 0;
unsigned long ultimoRiegoFin = 0;
bool          hayRiegoPrevio = false;
String        estadoTexto    = "Iniciando";
String        ultimoIdEjecutado = "";  // evita repetir una orden si falló la confirmación

unsigned long ultimaTelemetria = 0;
unsigned long ultimoComando    = 0;
unsigned long ultimaLectura    = 0;
unsigned long ultimoIntentoWifi = 0;
unsigned long pantallaFijaHasta = 0;  // para mostrar mensajes sin delay()
bool          reportarYa = false;     // avisar al panel en cuanto cambia la bomba
bool          apiOk      = true;      // resultado de la última llamada a la API
unsigned long ultimoDibujoRiego = 0;
// Mientras riega solo se consulta la API si queda al menos este margen:
// una conexión lenta nunca debe alargar el riego.
const unsigned long MARGEN_CONSULTA_REGANDO = 6000UL;

// ---------- PANTALLAS ----------
void dibujarGotaDeAgua(int x, int y, int tamano) {
  display.fillCircle(x, y + (tamano / 2), tamano / 2, SSD1306_WHITE);
  display.fillTriangle(x, y - tamano, x - (tamano / 2.5), y + (tamano / 4), x + (tamano / 2.5), y + (tamano / 4), SSD1306_WHITE);
}

void actualizarPantalla() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);  display.print("-- "); display.print(DEVICE_ID); display.print(modo == "manual" ? " [MAN]" : " [AUTO]");
  display.setCursor(0, 15); display.print("Hum. Suelo: ");
  if (sensorSueloOk) { display.print(humedadSuelo); display.print("%"); } else display.print("ERROR");
  display.setCursor(0, 30); display.print("Temp: "); if (isnan(temp)) display.print("--"); else display.print(temp, 1); display.print(" C");
  display.setCursor(0, 45); display.print("Hum. Amb: "); if (isnan(humAmbiente)) display.print("--"); else display.print(humAmbiente, 0); display.print("%");
  display.setCursor(0, 56); display.print(estadoTexto);
  display.display();
}

void pantallaRiego(int segundosRestantes) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(30, 0); display.print("REGANDO...");
  dibujarGotaDeAgua(64, 32, 14);
  display.setCursor(25, 54); display.print("Quedan: "); display.print(segundosRestantes); display.print(" seg");
  display.display();
}

unsigned long restanteRiegoMs() {
  unsigned long pasado = millis() - bombaInicio;
  return pasado >= bombaDuracionMs ? 0 : bombaDuracionMs - pasado;
}

// Redibuja la gotita y la cuenta regresiva (como mucho 4 veces por segundo).
void mostrarRiego(bool forzar) {
  if (!bombaEncendida) return;
  if (!forzar && millis() - ultimoDibujoRiego < 250) return;
  ultimoDibujoRiego = millis();
  pantallaRiego((int)((restanteRiegoMs() + 999UL) / 1000UL));
}

void pantallaMensaje(const char* titulo, const char* grande, const String& abajo, unsigned long ms) {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1); display.setCursor(5, 0);  display.print(titulo);
  display.setTextSize(2); display.setCursor(0, 20); display.print(grande);
  display.setTextSize(1); display.setCursor(0, 48); display.print(abajo);
  display.display();
  pantallaFijaHasta = millis() + ms;
}

// ---------- BOMBA ----------
void encenderBomba(int segundos, const char* origen) {
  segundos = constrain(segundos, 1, RIEGO_MAX_SEG);
  digitalWrite(RELAY_PIN, RELE_ACTIVO);
  bombaEncendida  = true;
  bombaInicio     = millis();
  bombaDuracionMs = (unsigned long)segundos * 1000UL;
  reportarYa      = true;
  pantallaFijaHasta = 0;
  mostrarRiego(true);   // la gotita aparece en cuanto se activa el relé
  Serial.print(">>> Bomba ON ("); Serial.print(origen); Serial.print(") ");
  Serial.print(segundos); Serial.println(" s");
}

void apagarBomba(const char* motivo) {
  digitalWrite(RELAY_PIN, RELE_INACTIVO);
  if (bombaEncendida) {
    bombaEncendida = false;
    ultimoRiegoFin = millis();
    hayRiegoPrevio = true;
    reportarYa     = true;  // el panel se entera en la siguiente vuelta del loop
    Serial.print(">>> Bomba OFF: "); Serial.println(motivo);
  }
}

// Se llama en cada vuelta del loop: apaga la bomba a tiempo aunque haya red lenta.
void gestionarBomba() {
  if (bombaEncendida && millis() - bombaInicio >= bombaDuracionMs) {
    apagarBomba("tiempo cumplido");
    estadoTexto = "Riego completado";
    actualizarPantalla();
  }
}

bool enAbsorcion() {
  return hayRiegoPrevio && millis() - ultimoRiegoFin < ABSORCION_MS;
}

// ---------- SENSORES ----------
void leerSensores() {
  long suma = 0;
  for (int i = 0; i < 20; i++) { suma += analogRead(SOIL_PIN); delay(5); }
  soilRaw = suma / 20;
  sensorSueloOk = soilRaw >= RAW_MIN_VALIDO && soilRaw <= RAW_MAX_VALIDO;
  humedadSuelo = constrain(map(soilRaw, RAW_SECO, RAW_MOJADO, 0, 100), 0, 100);
  temp = dht.readTemperature();
  humAmbiente = dht.readHumidity();
}

// ---------- WIFI ----------
bool wifiOk() {
  return WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0);
}

// No bloquea: reintenta como máximo cada 15 s.
void asegurarWifi() {
  if (wifiOk() || millis() - ultimoIntentoWifi < 15000UL) return;
  ultimoIntentoWifi = millis();
  Serial.println("WiFi desconectado. Reconectando...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ---------- HTTP ----------
// Lee la respuesta completa y devuelve solo el JSON del cuerpo.
String leerRespuesta(Client& c, unsigned long timeoutMs, int& status) {
  String resp = "";
  unsigned long t = millis();
  while ((c.connected() || c.available()) && millis() - t < timeoutMs) {
    while (c.available()) { resp += (char)c.read(); t = millis(); }
    gestionarBomba();     // la bomba se apaga a tiempo aunque la red tarde
    mostrarRiego(false);  // y la cuenta regresiva sigue avanzando
  }
  c.stop();
  int sp = resp.indexOf(' ');
  status = sp > 0 ? resp.substring(sp + 1, sp + 4).toInt() : 0;
  int ini = resp.indexOf('{'), fin = resp.lastIndexOf('}');
  return (ini >= 0 && fin > ini) ? resp.substring(ini, fin + 1) : "";
}

bool apiRequest(const char* metodo, const String& ruta, String& cuerpo, unsigned long timeoutMs) {
  if (!wifiOk()) return false;
  Client& c = API_HTTPS ? (Client&)clientApi : (Client&)clientApiPlano;
  c.stop();
  mostrarRiego(true);
  if (!c.connect(API_HOST, API_HTTPS ? 443 : 80)) {
    apiOk = false;
    Serial.print("API: fallo de conexion con "); Serial.print(API_HOST);
    Serial.println(API_HTTPS ? " (HTTPS)" : " (HTTP)");
    gestionarBomba();
    return false;
  }
  c.print(metodo); c.print(" "); c.print(ruta); c.println(" HTTP/1.1");
  c.print("Host: "); c.println(API_HOST);
  c.println("User-Agent: HydraCloud-UNO-R4");
  c.println("ngrok-skip-browser-warning: 1");
  if (strlen(DEVICE_TOKEN) > 0) { c.print("Authorization: Bearer "); c.println(DEVICE_TOKEN); }
  c.println("Content-Length: 0");
  c.println("Connection: close");
  c.println();
  int status = 0;
  cuerpo = leerRespuesta(c, timeoutMs, status);
  apiOk = status >= 200 && status < 300;
  if (!apiOk) { Serial.print("API: HTTP "); Serial.println(status); return false; }
  return true;
}

// ---------- ÓRDENES DEL PANEL / GREENBOT ----------
void completarComando(const String& id) {
  String cuerpo;
  if (apiRequest("PUT", "/api/comandos/completar/" + id, cuerpo, 4000)) Serial.println("   Orden confirmada");
}

void consultarComandos() {
  String cuerpo;
  // Se informa el estado REAL de la bomba para que el panel no dependa de Make
  long restante = bombaEncendida ? (long)((restanteRiegoMs() + 999UL) / 1000UL) : 0;
  String ruta = String("/api/comandos/pendiente?device_id=") + DEVICE_ID +
                "&bomba=" + (bombaEncendida ? "1" : "0") +
                "&restante=" + String(restante < 0 ? 0 : restante);
  if (!apiRequest("GET", ruta, cuerpo, 4000)) return;

  StaticJsonDocument<384> doc;
  if (deserializeJson(doc, cuerpo)) { Serial.println("API: JSON invalido"); return; }

  // Modo y umbral siempre vienen en la respuesta
  const char* m = doc["modo"] | "auto";
  if (modo != m) { modo = m; Serial.print("Modo -> "); Serial.println(modo); }
  umbral = doc["umbral"] | umbral;

  if (!(doc["hayComando"] | false)) return;
  String accion = doc["accion"] | "";
  String id     = doc["id"] | "";
  int duracion  = doc["duracion"] | 10;
  Serial.print("Orden del panel: "); Serial.print(accion); Serial.print(" "); Serial.println(duracion);

  // Si ya la ejecutamos pero no se pudo confirmar, solo se reintenta la confirmación.
  if (id.length() > 0 && id == ultimoIdEjecutado) { completarComando(id); return; }

  if (accion == "detener") {
    apagarBomba("orden detener");
    estadoTexto = "Detenido (panel)";
    actualizarPantalla();
  } else if (accion == "regar" && !bombaEncendida) {
    // Riego manual: el usuario lo pidió, se ignora el tiempo de absorción.
    encenderBomba(duracion, "panel");
    estadoTexto = "Riego manual";
  }
  // Se confirma al ejecutar (el panel muestra "Regando" durante `duracion`).
  ultimoIdEjecutado = id;
  if (id.length() > 0) completarComando(id);
}

// ---------- TELEMETRÍA A MAKE ----------
bool consultarMake(bool& riegoOut, int& duracionOut) {
  if (!wifiOk()) return false;
  clientMake.stop();
  Serial.print("-> Conectando a Make... ");
  if (!clientMake.connect(MAKE_HOST, 443)) { Serial.println("FALLO"); return false; }
  Serial.println("OK");

  String tempStr   = isnan(temp)        ? "null" : String(temp, 1);
  String humAmbStr = isnan(humAmbiente) ? "null" : String(humAmbiente, 1);

  // Campos nuevos para Make: modo, umbral y sensor_ok (úsalos en el filtro de decisión)
  String json = "{\"device_id\":\"" + String(DEVICE_ID) +
                "\",\"humedad\":" + String(humedadSuelo) +
                ",\"raw\":" + String(soilRaw) +
                ",\"temp\":" + tempStr +
                ",\"hum_amb\":" + humAmbStr +
                ",\"modo\":\"" + modo + "\"" +
                ",\"umbral\":" + String(umbral) +
                ",\"sensor_ok\":" + (sensorSueloOk ? "true" : "false") + "}";

  clientMake.println("POST " + String(MAKE_PATH) + " HTTP/1.1");
  clientMake.println("Host: " + String(MAKE_HOST));
  clientMake.println("Content-Type: application/json");
  clientMake.print("Content-Length: ");
  clientMake.println(json.length());
  clientMake.println("Connection: close");
  clientMake.println();
  clientMake.print(json);

  Serial.print("-> Esperando respuesta de Make... ");
  int status = 0;
  String cuerpo = leerRespuesta(clientMake, 15000, status);
  Serial.println("LISTO");
  if (cuerpo.length() == 0) { Serial.println("   (No se recibio JSON de Make)"); return false; }

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, cuerpo)) return false;
  riegoOut    = doc["riego"] | false;
  duracionOut = doc["duracion_seg"] | 10;
  return true;
}

void cicloTelemetria() {
  bool riego = false;
  int duracion = 0;
  estadoTexto = "Consultando Nube...";
  actualizarPantalla();

  if (!consultarMake(riego, duracion)) { estadoTexto = "Error Make"; return; }
  duracion = constrain(duracion, 1, RIEGO_MAX_SEG);
  Serial.print("Make dice: riego="); Serial.print(riego ? "true" : "false");
  Serial.print(" duracion_seg="); Serial.println(duracion);

  if (!riego) {
    estadoTexto = "Suelo OK";
    pantallaMensaje("RESPUESTA DE MAKE", "NO REGAR", "Sin riego este ciclo", 3000);
  } else if (modo == "manual") {
    estadoTexto = "Manual: no riega";
    pantallaMensaje("MODO MANUAL", "IGNORADO", "Make pidio riego", 3000);
  } else if (!sensorSueloOk) {
    estadoTexto = "Revisar sensor";
    pantallaMensaje("SENSOR SUELO", "ERROR", "Raw: " + String(soilRaw), 3000);
  } else if (enAbsorcion()) {
    unsigned long faltan = (ABSORCION_MS - (millis() - ultimoRiegoFin)) / 60000UL + 1;
    estadoTexto = "Absorbiendo " + String(faltan) + "m";
    Serial.println("   Riego omitido: el agua anterior aun se esta absorbiendo");
  } else {
    encenderBomba(duracion, "auto/Make");
    estadoTexto = "Riego Auto";
  }
}

// ---------- SETUP ----------
void setup() {
  // Relé en reposo ANTES de configurarlo como salida: evita un pulso a la bomba.
  digitalWrite(RELAY_PIN, RELE_INACTIVO);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELE_INACTIVO);

  Serial.begin(115200);
  delay(1500);
  Serial.println("\n--- HYDRA CLOUD: INICIANDO ---");

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) Serial.println(F("Fallo OLED."));

  dht.begin();
  analogReadResolution(12);

  estadoTexto = "Conectando WiFi...";
  actualizarPantalla();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long inicio = millis();
  while (!wifiOk() && millis() - inicio < 20000UL) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("Firmware WiFi: "); Serial.println(WiFi.firmwareVersion());
  if (wifiOk()) {
    Serial.print("IP Asignada: "); Serial.println(WiFi.localIP());
    Serial.print("API: "); Serial.print(API_HTTPS ? "https://" : "http://"); Serial.println(API_HOST);
    estadoTexto = "WiFi OK";
  } else {
    Serial.println("Error WiFi (se reintentara en el loop).");
    estadoTexto = "Error WiFi";
  }
  ultimoIntentoWifi = millis();
  leerSensores();
  actualizarPantalla();
  // Primera telemetría a los 5 s de arrancar
  ultimaTelemetria = millis() - INTERVALO_TELEMETRIA + 5000UL;
}

// ---------- LOOP (sin delays largos) ----------
void loop() {
  unsigned long ahora = millis();
  gestionarBomba();
  asegurarWifi();

  // Órdenes del panel: más seguido mientras riega para poder "detener"
  unsigned long intervaloCmd = bombaEncendida ? INTERVALO_COMANDOS_REGANDO : INTERVALO_COMANDOS;
  // Regando: solo se consulta si la API respondía bien y queda margen de tiempo.
  // Si la API falla, el riego termina por tiempo y se informa al apagarse.
  bool puedeConsultar = !bombaEncendida || (apiOk && restanteRiegoMs() > MARGEN_CONSULTA_REGANDO);
  if (puedeConsultar && (reportarYa || ahora - ultimoComando >= intervaloCmd)) {
    reportarYa = false;
    ultimoComando = ahora;
    consultarComandos();
    gestionarBomba();
  }

  if (bombaEncendida) {
    mostrarRiego(false);
    delay(20);
    return;  // durante el riego no se envía telemetría
  }

  if (ahora - ultimaLectura >= INTERVALO_SENSORES) {
    ultimaLectura = ahora;
    leerSensores();
    if (millis() > pantallaFijaHasta) actualizarPantalla();
  }

  if (ahora - ultimaTelemetria >= INTERVALO_TELEMETRIA) {
    ultimaTelemetria = millis();
    cicloTelemetria();
  }

  delay(50);
}
