/*
 * =============================================================================
 * VYRA — ESP32 Smart IoT Sensor Telemetry Node
 * Real-Time Voltage & Current Sensing with Self-Hosted Web Dashboard & REST API
 * =============================================================================
 * 
 * Hardware compatibility:
 * - Microcontroller: ESP32 DevKit V1, NodeMCU-32S, ESP32-WROOM-32
 * - Voltage Sensor: ZMPT101B (AC) or DC 0-25V Voltage Divider Module
 * - Current Sensor: ACS712-05B/20A/30A or SCT-013 CT Module
 * - Pins used: GPIO 34 (ADC1_CH6 - Voltage), GPIO 35 (ADC1_CH7 - Current)
 * 
 * Features:
 * - True RMS AC waveform sampling over 50Hz/60Hz grid cycles
 * - Embedded responsive dark-mode web server (no internet connection needed)
 * - JSON REST API (/api/data) with full Cross-Origin Resource Sharing (CORS)
 * - Auto Wi-Fi station connection + Fallback Access Point (AP) mode
 * - mDNS responder: access at http://vyra-esp32.local
 * - Zero-point dynamic software calibration endpoint (/api/calibrate)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include "config.h"
#include "web_page.h"

// -----------------------------------------------------------------------------
// Global Server and Telemetry Variables
// -----------------------------------------------------------------------------
WebServer server(80);

float voltageRMS        = 0.0f;
float currentRMS        = 0.0f;
float powerWatts        = 0.0f;
float energyKWh         = 0.0f;

int   lastRawVoltADC    = 0;
int   lastRawCurrADC    = 0;

int   dynamicVoltZero   = VOLTAGE_ZERO_OFFSET_COUNTS;
int   dynamicCurrZero   = CURRENT_ZERO_OFFSET_COUNTS;

unsigned long lastTelemetryMillis = 0;
unsigned long lastEnergyMillis    = 0;

// -----------------------------------------------------------------------------
// Sensor Measurement Functions
// -----------------------------------------------------------------------------

/**
 * True-RMS AC Waveform Sampling Engine
 * Samples the AC sine wave across multiple cycles to compute accurate RMS voltage and current.
 */
void sampleACSensors() {
  unsigned long sampleDurationMicros = (1000000UL / AC_GRID_FREQUENCY_HZ) * AC_SAMPLE_CYCLES;
  unsigned long startMicros = micros();

  double vSumSquares = 0.0;
  double iSumSquares = 0.0;
  long sampleCount = 0;

  int lastV = 0;
  int lastI = 0;

  while ((micros() - startMicros) < sampleDurationMicros && sampleCount < RMS_SAMPLE_COUNT) {
    int vRaw = analogRead(PIN_VOLTAGE_SENSOR);
    int iRaw = analogRead(PIN_CURRENT_SENSOR);

    lastV = vRaw;
    lastI = iRaw;

    // Center around DC bias midpoint
    double vCentered = (double)(vRaw - dynamicVoltZero);
    double iCentered = (double)(iRaw - dynamicCurrZero);

    vSumSquares += (vCentered * vCentered);
    iSumSquares += (iCentered * iCentered);
    sampleCount++;

    delayMicroseconds(20); // Small interval for stable ADC conversion
  }

  if (sampleCount > 0) {
    lastRawVoltADC = lastV;
    lastRawCurrADC = lastI;

    // True RMS in ADC counts
    double vRMS_counts = sqrt(vSumSquares / (double)sampleCount);
    double iRMS_counts = sqrt(iSumSquares / (double)sampleCount);

    // Convert voltage counts to Volts RMS
    double vPinVolts = (vRMS_counts / ADC_MAX_COUNTS) * ADC_REF_VOLTAGE;
    voltageRMS = (float)(vPinVolts * VOLTAGE_CALIBRATION_FACTOR);

    // Convert current counts to Amperes RMS
    double iPinVolts = (iRMS_counts / ADC_MAX_COUNTS) * ADC_REF_VOLTAGE;
    currentRMS = (float)((iPinVolts / ACS712_SENSITIVITY_V_PER_A) * CURRENT_CALIBRATION_FACTOR);

    // Filter out floating/ambient baseline noise
    if (voltageRMS < VOLTAGE_NOISE_CUTOFF) voltageRMS = 0.0f;
    if (currentRMS < CURRENT_NOISE_CUTOFF) currentRMS = 0.0f;
  }
}

/**
 * DC Averaging Sensor Engine
 * Measures DC voltage and current using moving-average oversampling.
 */
void sampleDCSensors() {
  long vSum = 0;
  long iSum = 0;
  const int dcSamples = 100;

  for (int i = 0; i < dcSamples; i++) {
    vSum += analogRead(PIN_VOLTAGE_SENSOR);
    iSum += analogRead(PIN_CURRENT_SENSOR);
    delayMicroseconds(100);
  }

  lastRawVoltADC = vSum / dcSamples;
  lastRawCurrADC = iSum / dcSamples;

  // DC Voltage calculation via divider ratio
  float pinVolt = ((float)lastRawVoltADC / ADC_MAX_COUNTS) * ADC_REF_VOLTAGE;
  voltageRMS = pinVolt * DC_VOLTAGE_DIVIDER_RATIO;

  // DC Current calculation via ACS712 sensitivity
  float currCentered = (float)(lastRawCurrADC - dynamicCurrZero);
  float currPinVolt = (currCentered / ADC_MAX_COUNTS) * ADC_REF_VOLTAGE;
  currentRMS = (currPinVolt / ACS712_SENSITIVITY_V_PER_A) * CURRENT_CALIBRATION_FACTOR;

  if (voltageRMS < VOLTAGE_NOISE_CUTOFF) voltageRMS = 0.0f;
  if (fabs(currentRMS) < CURRENT_NOISE_CUTOFF) currentRMS = 0.0f;
}

/**
 * Executes sensor sampling and accumulates power/energy
 */
void updateSensorReadings() {
  if (MODE_AC) {
    sampleACSensors();
  } else {
    sampleDCSensors();
  }

  // Active / Apparent Power in Watts (P = V * I)
  powerWatts = voltageRMS * currentRMS;

  // Accumulated Energy in kWh (E = E + P * dt)
  unsigned long now = millis();
  if (lastEnergyMillis > 0) {
    float deltaHours = (float)(now - lastEnergyMillis) / 3600000.0f;
    energyKWh += (powerWatts / 1000.0f) * deltaHours;
  }
  lastEnergyMillis = now;
}

// -----------------------------------------------------------------------------
// HTTP REST Handlers
// -----------------------------------------------------------------------------

/**
 * Serves the primary embedded web dashboard
 */
void handleRoot() {
  server.send_P(200, "text/html", MAIN_page);
}

/**
 * Returns JSON telemetry for frontend / REST API consumers with CORS headers
 */
void handleGetTelemetry() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

  String json = "{";
  json += "\"voltage\":" + String(voltageRMS, 2) + ",";
  json += "\"current\":" + String(currentRMS, 3) + ",";
  json += "\"power\":" + String(powerWatts, 2) + ",";
  json += "\"energy_kwh\":" + String(energyKWh, 4) + ",";
  json += "\"raw_voltage_adc\":" + String(lastRawVoltADC) + ",";
  json += "\"raw_current_adc\":" + String(lastRawCurrADC) + ",";
  json += "\"mode\":\"" + String(MODE_AC ? "AC_RMS" : "DC") + "\",";
  json += "\"ssid\":\"" + WiFi.SSID() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
  json += "\"uptime_sec\":" + String(millis() / 1000);
  json += "}";

  server.send(200, "application/json", json);
}

/**
 * Auto zero-point offset calibration endpoint
 * Averages 500 idle readings to calculate accurate midpoints.
 */
void handleCalibrate() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  long sumV = 0;
  long sumI = 0;
  const int calSamples = 500;

  for (int i = 0; i < calSamples; i++) {
    sumV += analogRead(PIN_VOLTAGE_SENSOR);
    sumI += analogRead(PIN_CURRENT_SENSOR);
    delayMicroseconds(200);
  }

  dynamicVoltZero = sumV / calSamples;
  dynamicCurrZero = sumI / calSamples;

  String json = "{";
  json += "\"status\":\"calibrated\",";
  json += "\"voltage_offset\":" + String(dynamicVoltZero) + ",";
  json += "\"current_offset\":" + String(dynamicCurrZero);
  json += "}";

  server.send(200, "application/json", json);
  Serial.printf("[CALIBRATION] New Zero Offsets -> Volt: %d, Curr: %d\n", dynamicVoltZero, dynamicCurrZero);
}

/**
 * Safe software reboot endpoint
 */
void handleRestart() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"rebooting\"}");
  delay(1000);
  ESP.restart();
}

/**
 * HTTP 404 handler
 */
void handleNotFound() {
  if (server.method() == HTTP_OPTIONS) {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "*");
    server.send(204);
  } else {
    server.send(404, "text/plain", "404 Not Found");
  }
}

// -----------------------------------------------------------------------------
// Setup & Loop
// -----------------------------------------------------------------------------

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  delay(500);

  Serial.println("\n==================================================");
  Serial.println("  VYRA ESP32 Smart IoT Power & Sensor Hub");
  Serial.println("==================================================");

  // Configure ADC resolution and input pins
  pinMode(PIN_VOLTAGE_SENSOR, INPUT);
  pinMode(PIN_CURRENT_SENSOR, INPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  analogReadResolution(ADC_RESOLUTION_BITS);
  analogSetAttenuation(ADC_11db); // 0-3.3V range

  // Connect to Wi-Fi
  Serial.printf("[WIFI] Connecting to SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);

  #if USE_STATIC_IP
    IPAddress ip(STATIC_IP);
    IPAddress gateway(STATIC_GATEWAY);
    IPAddress subnet(STATIC_SUBNET);
    IPAddress dns(STATIC_DNS);
    WiFi.config(ip, gateway, subnet, dns);
  #endif

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected Successfully!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
  } else {
    Serial.println("\n[WIFI] Failed to connect to router. Starting Fallback AP...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.print("[WIFI] AP SSID: ");
    Serial.println(AP_SSID);
    Serial.print("[WIFI] AP IP Address: ");
    Serial.println(WiFi.softAPIP());
  }

  // Setup mDNS
  if (MDNS.begin(MDNS_HOSTNAME)) {
    Serial.printf("[mDNS] Responder started at http://%s.local\n", MDNS_HOSTNAME);
    MDNS.addService("http", "tcp", 80);
  }

  // Web Server Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/data", HTTP_GET, handleGetTelemetry);
  server.on("/api/calibrate", HTTP_GET, handleCalibrate);
  server.on("/api/restart", HTTP_GET, handleRestart);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("[HTTP] Web Server running on port 80");
  Serial.println("==================================================\n");

  lastEnergyMillis = millis();
}

void loop() {
  // Handle incoming HTTP client requests
  server.handleClient();

  // Periodic sensor sampling and telemetry update
  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMillis = currentMillis;

    updateSensorReadings();

    // Print live serial debug output
    Serial.printf("[TELEMETRY] Voltage: %6.1f V | Current: %5.2f A | Power: %6.1f W | Energy: %7.4f kWh\n",
                  voltageRMS, currentRMS, powerWatts, energyKWh);
  }
}
