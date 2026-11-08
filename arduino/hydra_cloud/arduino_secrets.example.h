// Copia este archivo como "arduino_secrets.h" (misma carpeta) y rellena tus datos.
// arduino_secrets.h está en .gitignore: NUNCA lo subas al repo.
#pragma once

#define SECRET_WIFI_SSID     "TU_RED"
#define SECRET_WIFI_PASSWORD "TU_PASSWORD"

// Webhook de Make (telemetría y decisión de riego)
#define SECRET_MAKE_HOST "hook.us2.make.com"
#define SECRET_MAKE_PATH "/TU_ID_DE_WEBHOOK"

// Tu API de Hydra Cloud a través de ngrok (solo el dominio, sin https:// ni barra final)
#define SECRET_API_HOST "TU-DOMINIO.ngrok-free.app"

// Igual que DEVICE_TOKEN en server/.env. Déjalo "" si no lo has configurado.
#define SECRET_DEVICE_TOKEN ""
