/*
 * =====================================================================================
 *  VYRA — ESP32 ALL-IN-ONE SMART IOT SENSOR & WEB DASHBOARD FIRMWARE
 * =====================================================================================
 *  Features Included:
 *   1. Measures Real-Time AC/DC Voltage (ZMPT101B or 0-25V Voltage Divider)
 *   2. Measures Real-Time AC/DC Current (ACS712 5A/20A/30A or SCT-013 CT)
 *   3. Computes True-RMS, Power (Watts & kW), and Accumulated Energy (kWh)
 *   4. Connects to Wi-Fi with Auto-Reconnect & Fallback Access Point (AP Mode)
 *   5. Hosts a Built-in Futuristic Dark-Mode Web Dashboard on the ESP32 (Port 80)
 *   6. Provides JSON REST API (/api/data) with full CORS for external websites
 *   7. Supports Cloud/Website HTTP POST Telemetry Push (Optional to Vercel/Server)
 *   8. mDNS Service: Access via http://vyra-esp32.local
 *   9. Zero-Point Calibration Endpoint (/api/calibrate)
 *   10. Hardware ADC1 Pins used (GPIO 34 & 35) to prevent Wi-Fi Radio Interference
 * =====================================================================================
 *  HARDWARE WIRING:
 *   - Voltage Sensor OUT  --> GPIO 34 (ADC1_CH6)
 *   - Current Sensor OUT  --> GPIO 35 (ADC1_CH7)
 *   - Both Sensor VCC     --> 5V (or VIN / 3.3V depending on module)
 *   - Both Sensor GND     --> ESP32 GND
 *   - Status LED (optional)--> GPIO 2 (Built-in LED on ESP32 DevKit)
 * =====================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>

// =====================================================================================
// 1. CONFIGURATION & CREDENTIALS
// =====================================================================================

// Wi-Fi Credentials (Change these to your router / hotspot credentials)
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Fallback SoftAP if Wi-Fi connection fails
const char* AP_SSID       = "VYRA_ESP32_AP";
const char* AP_PASSWORD   = "vyra12345";

// mDNS hostname (access at http://vyra-esp32.local)
const char* MDNS_NAME     = "vyra-esp32";

// Optional: Push telemetry to an external website / cloud endpoint (e.g. Vercel backend / webhook)
#define ENABLE_CLOUD_PUSH  false
const char* CLOUD_API_URL = "https://your-website.com/api/telemetry";

// Hardware Pins (Must be ADC1 pins: 32, 33, 34, 35, 36, 39 to avoid Wi-Fi radio conflicts)
#define PIN_VOLTAGE_ADC    34   // GPIO 34 (ADC1_CH6) - Voltage Sensor
#define PIN_CURRENT_ADC    35   // GPIO 35 (ADC1_CH7) - Current Sensor
#define PIN_STATUS_LED     2    // GPIO 2  - Built-in Blue LED

// Sensor Mode (true = AC Mains with True-RMS, false = DC Circuit)
#define SENSOR_MODE_AC     true

// Calibration Factors (Adjust to match your multimeter readings)
#define AC_GRID_FREQ_HZ    50           // 50 Hz (India/UK/EU) or 60 Hz (USA)
#define VOLT_CALIB_FACTOR  238.5f       // Multiplier for ZMPT101B module
#define ACS712_SENSITIVITY 0.066f       // 0.066 for 30A module, 0.100 for 20A, 0.185 for 5A
#define CURR_CALIB_FACTOR  1.00f        // Current fine-tuning scale factor

// Noise Cutoff (values below this are clamped to 0.0 to eliminate floating pin noise)
#define VOLT_CUTOFF        3.0f         // Volts
#define CURR_CUTOFF        0.08f        // Amperes

// ADC Specifications
#define ADC_RESOLUTION     12           // 12-bit ADC (0 - 4095)
#define ADC_MAX_VAL        4095.0f
#define ADC_REF_VOLT       3.3f         // ESP32 ADC Reference Voltage

// =====================================================================================
// 2. GLOBAL VARIABLES
// =====================================================================================
WebServer server(80);

float voltageRMS       = 0.0f;
float currentRMS       = 0.0f;
float powerWatts       = 0.0f;
float energyKWh        = 0.0f;

int   lastRawVoltADC   = 0;
int   lastRawCurrADC   = 0;

int   voltZeroOffset   = 1865;  // Default ADC midpoint for AC sensor
int   currZeroOffset   = 2048;  // Default ADC midpoint for ACS712

unsigned long lastSampleTime    = 0;
unsigned long lastCloudPushTime = 0;
unsigned long lastEnergyCalc    = 0;

// =====================================================================================
// 3. EMBEDDED WEB DASHBOARD (Stored in Flash Memory)
// =====================================================================================
const char DASHBOARD_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VYRA — ESP32 Sensor Web Dashboard</title>
  <style>
    :root {
      --bg: #030712;
      --card: rgba(15, 23, 42, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --green: #10b981;
      --cyan: #06b6d4;
      --amber: #f59e0b;
      --purple: #a855f7;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.1) 0%, transparent 60%);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container { width: 100%; max-width: 1050px; }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .logo {
      width: 42px; height: 42px; border-radius: 10px;
      background: linear-gradient(135deg, var(--green), var(--cyan));
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
    }
    .logo svg { width: 22px; height: 22px; fill: #030712; }
    h1 { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .subtitle { font-size: 0.75rem; color: var(--muted); font-family: monospace; }
    .pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.85rem; border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 0.8rem; font-family: monospace; color: #34d399;
    }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--green); box-shadow: 0 0 8px var(--green);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .grid-metrics {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .card {
      background: var(--card); backdrop-filter: blur(12px);
      border: 1px solid var(--border); border-radius: 16px;
      padding: 1.25rem; position: relative; overflow: hidden;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-2px); border-color: rgba(255, 255, 255, 0.15); }
    .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .card-v::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .card-i::before { background: linear-gradient(90deg, #06b6d4, #38bdf8); }
    .card-p::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .card-e::before { background: linear-gradient(90deg, #a855f7, #c084fc); }
    .card-title { font-size: 0.75rem; text-transform: uppercase; color: var(--muted); font-weight: 600; }
    .val {
      font-family: monospace; font-size: 2.3rem; font-weight: 700;
      margin: 0.4rem 0; display: flex; align-items: baseline; gap: 0.3rem;
    }
    .unit { font-size: 1rem; color: var(--muted); font-weight: 500; }
    .sub { font-size: 0.72rem; color: var(--muted); font-family: monospace; display: flex; justify-content: space-between; }
    .chart-section {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem;
    }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    canvas { width: 100%; height: 160px; border-radius: 8px; }
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem; margin-bottom: 1.5rem;
    }
    .info-card { background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border); border-radius: 12px; padding: 0.85rem; }
    .info-lbl { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; margin-bottom: 0.2rem; }
    .info-txt { font-family: monospace; font-size: 0.95rem; font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end; margin-bottom: 1.5rem; }
    .btn {
      background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border);
      color: var(--text); padding: 0.5rem 1rem; border-radius: 8px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s;
    }
    .btn:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.2); }
    .btn-green { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); color: #34d399; }
    footer { text-align: center; font-size: 0.75rem; color: var(--muted); padding-top: 1rem; border-top: 1px solid var(--border); width: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div>
          <h1>VYRA IoT Power Hub</h1>
          <div class="subtitle">ESP32 Live Voltage & Current Monitor</div>
        </div>
      </div>
      <div class="pill">
        <div class="dot" id="liveDot"></div>
        <span id="connStatus">ONLINE (WiFi)</span>
      </div>
    </header>

    <div class="grid-metrics">
      <div class="card card-v">
        <div class="card-title">AC Voltage (RMS)</div>
        <div class="val" style="color: #34d399;"><span id="valVolt">0.0</span><span class="unit">V</span></div>
        <div class="sub"><span>ADC: <strong id="valAdcV">-</strong></span><span>Peak: <strong id="valPeakV">0.0V</strong></span></div>
      </div>

      <div class="card card-i">
        <div class="card-title">AC Current (RMS)</div>
        <div class="val" style="color: #38bdf8;"><span id="valCurr">0.00</span><span class="unit">A</span></div>
        <div class="sub"><span>ADC: <strong id="valAdcI">-</strong></span><span>Peak: <strong id="valPeakI">0.00A</strong></span></div>
      </div>

      <div class="card card-p">
        <div class="card-title">Active Power</div>
        <div class="val" style="color: #fbbf24;"><span id="valPower">0.0</span><span class="unit">W</span></div>
        <div class="sub"><span>Power: <strong id="valPowerKW">0.000 kW</strong></span><span>50/60 Hz</span></div>
      </div>

      <div class="card card-e">
        <div class="card-title">Accumulated Energy</div>
        <div class="val" style="color: #c084fc;"><span id="valEnergy">0.000</span><span class="unit">kWh</span></div>
        <div class="sub"><span>Watt-Hours: <strong id="valEnergyWh">0 Wh</strong></span><span>Session</span></div>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-header">
        <div style="font-weight: 700; font-size: 0.95rem;">Real-Time Waveform Trend</div>
        <div style="font-family: monospace; font-size: 0.75rem; color: var(--muted);" id="updateTime">Connecting...</div>
      </div>
      <canvas id="liveChart"></canvas>
    </div>

    <div class="info-grid">
      <div class="info-card"><div class="info-lbl">Wi-Fi Network</div><div class="info-txt" id="txtSSID">--</div></div>
      <div class="info-card"><div class="info-lbl">Signal (RSSI)</div><div class="info-txt" id="txtRSSI">-- dBm</div></div>
      <div class="info-card"><div class="info-lbl">ESP32 IP</div><div class="info-txt" id="txtIP">--</div></div>
      <div class="info-card"><div class="info-lbl">Uptime</div><div class="info-txt" id="txtUptime">00:00:00</div></div>
    </div>

    <div class="actions">
      <a href="/api/data" target="_blank" class="btn">JSON REST API</a>
      <button class="btn btn-green" id="btnCalib" onclick="zeroCalibrate()">Zero Calibrate Offsets</button>
      <button class="btn" onclick="rebootESP()">Reboot ESP32</button>
    </div>

    <footer>VYRA IoT Node &bull; Dual AC/DC Sensing &bull; Self-Hosted Web Server on ESP32</footer>
  </div>

  <script>
    const canvas = document.getElementById('liveChart');
    const ctx = canvas.getContext('2d');
    const vHist = [], iHist = [], maxP = 35;

    function resize() {
      canvas.width = canvas.parentElement.clientWidth - 40;
      canvas.height = 150;
      draw();
    }
    window.addEventListener('resize', resize);

    function draw() {
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      for (let y = 20; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (vHist.length < 2) return;
      const step = w / (maxP - 1);

      // Voltage line
      ctx.beginPath();
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5;
      for (let i = 0; i < vHist.length; i++) {
        const y = h - 10 - ((vHist[i] / 300) * (h - 20));
        if (i === 0) ctx.moveTo(i * step, y); else ctx.lineTo(i * step, y);
      }
      ctx.stroke();

      // Current line
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2;
      for (let i = 0; i < iHist.length; i++) {
        const y = h - 10 - ((iHist[i] / 30) * (h - 20));
        if (i === 0) ctx.moveTo(i * step, y); else ctx.lineTo(i * step, y);
      }
      ctx.stroke();
    }

    async function pollData() {
      try {
        const r = await fetch('/api/data', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const d = await r.json();

        document.getElementById('valVolt').textContent = d.voltage.toFixed(1);
        document.getElementById('valCurr').textContent = d.current.toFixed(2);
        document.getElementById('valPower').textContent = d.power.toFixed(1);
        document.getElementById('valPowerKW').textContent = (d.power / 1000).toFixed(3) + ' kW';
        document.getElementById('valEnergy').textContent = d.energy_kwh.toFixed(3);
        document.getElementById('valEnergyWh').textContent = (d.energy_kwh * 1000).toFixed(1) + ' Wh';

        document.getElementById('valAdcV').textContent = d.raw_voltage_adc;
        document.getElementById('valAdcI').textContent = d.raw_current_adc;
        document.getElementById('valPeakV').textContent = (d.voltage * 1.414).toFixed(1) + 'V';
        document.getElementById('valPeakI').textContent = (d.current * 1.414).toFixed(2) + 'A';

        document.getElementById('txtSSID').textContent = d.ssid || 'Connected';
        document.getElementById('txtRSSI').textContent = d.rssi + ' dBm';
        document.getElementById('txtIP').textContent = d.ip;

        const s = d.uptime_sec || 0;
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const sc = String(s % 60).padStart(2, '0');
        document.getElementById('txtUptime').textContent = `${h}:${m}:${sc}`;

        document.getElementById('updateTime').textContent = 'Live • ' + new Date().toLocaleTimeString();
        document.getElementById('liveDot').style.background = '#10b981';
        document.getElementById('connStatus').textContent = 'ONLINE (Live)';

        vHist.push(d.voltage);
        iHist.push(d.current);
        if (vHist.length > maxP) { vHist.shift(); iHist.shift(); }
        draw();
      } catch (e) {
        document.getElementById('connStatus').textContent = 'RECONNECTING...';
        document.getElementById('liveDot').style.background = '#f43f5e';
      }
    }

    async function zeroCalibrate() {
      const b = document.getElementById('btnCalib');
      b.textContent = 'Calibrating...';
      try {
        const r = await fetch('/api/calibrate');
        const j = await r.json();
        alert('Calibrated!\nVoltage Zero: ' + j.voltage_offset + '\nCurrent Zero: ' + j.current_offset);
      } catch (e) { alert('Calibration failed: ' + e); }
      finally { b.textContent = 'Zero Calibrate Offsets'; }
    }

    async function rebootESP() {
      if (confirm('Reboot ESP32?')) {
        await fetch('/api/restart');
        alert('ESP32 rebooting. Reloading page...');
        setTimeout(() => location.reload(), 5000);
      }
    }

    resize();
    pollData();
    setInterval(pollData, 1000);
  </script>
</body>
</html>
)rawliteral";

// =====================================================================================
// 4. SENSOR SAMPLING ALGORITHMS
// =====================================================================================

// Samples AC Sine Wave over complete wave cycles and computes True-RMS
void readACSensors() {
  unsigned long cycleTimeMicros = 1000000UL / AC_GRID_FREQ_HZ;
  unsigned long totalWindowMicros = cycleTimeMicros * 3; // 3 full AC cycles (60ms @ 50Hz)
  unsigned long startMicros = micros();

  double vSumSq = 0.0;
  double iSumSq = 0.0;
  long sampleCount = 0;

  int lastV = 0, lastI = 0;

  while ((micros() - startMicros) < totalWindowMicros && sampleCount < 1000) {
    int vRaw = analogRead(PIN_VOLTAGE_ADC);
    int iRaw = analogRead(PIN_CURRENT_ADC);

    lastV = vRaw;
    lastI = iRaw;

    double vCentered = (double)(vRaw - voltZeroOffset);
    double iCentered = (double)(iRaw - currZeroOffset);

    vSumSq += (vCentered * vCentered);
    iSumSq += (iCentered * iCentered);
    sampleCount++;

    delayMicroseconds(20);
  }

  if (sampleCount > 0) {
    lastRawVoltADC = lastV;
    lastRawCurrADC = lastI;

    double vRMSCounts = sqrt(vSumSq / (double)sampleCount);
    double iRMSCounts = sqrt(iSumSq / (double)sampleCount);

    double vPinVolts = (vRMSCounts / ADC_MAX_VAL) * ADC_REF_VOLT;
    voltageRMS = (float)(vPinVolts * VOLT_CALIB_FACTOR);

    double iPinVolts = (iRMSCounts / ADC_MAX_VAL) * ADC_REF_VOLT;
    currentRMS = (float)((iPinVolts / ACS712_SENSITIVITY) * CURR_CALIB_FACTOR);

    // Apply baseline noise cutoff
    if (voltageRMS < VOLT_CUTOFF) voltageRMS = 0.0f;
    if (currentRMS < CURR_CUTOFF) currentRMS = 0.0f;
  }
}

// DC Sensor Sampling with Multi-Sample Smoothing
void readDCSensors() {
  long vSum = 0, iSum = 0;
  const int samples = 100;

  for (int i = 0; i < samples; i++) {
    vSum += analogRead(PIN_VOLTAGE_ADC);
    iSum += analogRead(PIN_CURRENT_ADC);
    delayMicroseconds(80);
  }

  lastRawVoltADC = vSum / samples;
  lastRawCurrADC = iSum / samples;

  // 0-25V voltage divider ratio (5:1)
  float pinVolt = ((float)lastRawVoltADC / ADC_MAX_VAL) * ADC_REF_VOLT;
  voltageRMS = pinVolt * 5.0f;

  float currCentered = (float)(lastRawCurrADC - currZeroOffset);
  float currPinVolt = (currCentered / ADC_MAX_VAL) * ADC_REF_VOLT;
  currentRMS = (currPinVolt / ACS712_SENSITIVITY) * CURR_CALIB_FACTOR;

  if (voltageRMS < VOLT_CUTOFF) voltageRMS = 0.0f;
  if (fabs(currentRMS) < CURR_CUTOFF) currentRMS = 0.0f;
}

void performMeasurement() {
  if (SENSOR_MODE_AC) {
    readACSensors();
  } else {
    readDCSensors();
  }

  // Active / Apparent Power in Watts
  powerWatts = voltageRMS * currentRMS;

  // Accumulated Energy in kWh
  unsigned long now = millis();
  if (lastEnergyCalc > 0) {
    float deltaHours = (float)(now - lastEnergyCalc) / 3600000.0f;
    energyKWh += (powerWatts / 1000.0f) * deltaHours;
  }
  lastEnergyCalc = now;
}

// =====================================================================================
// 5. REST API & WEB SERVER HANDLERS
// =====================================================================================

// Serves the Web Dashboard
void handleRoot() {
  server.send_P(200, "text/html", DASHBOARD_HTML);
}

// Returns Live Sensor Data in JSON format with full CORS enabled
void handleGetData() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");

  String json = "{";
  json += "\"voltage\":" + String(voltageRMS, 2) + ",";
  json += "\"current\":" + String(currentRMS, 3) + ",";
  json += "\"power\":" + String(powerWatts, 2) + ",";
  json += "\"energy_kwh\":" + String(energyKWh, 4) + ",";
  json += "\"raw_voltage_adc\":" + String(lastRawVoltADC) + ",";
  json += "\"raw_current_adc\":" + String(lastRawCurrADC) + ",";
  json += "\"mode\":\"" + String(SENSOR_MODE_AC ? "AC_RMS" : "DC") + "\",";
  json += "\"ssid\":\"" + WiFi.SSID() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
  json += "\"uptime_sec\":" + String(millis() / 1000);
  json += "}";

  server.send(200, "application/json", json);
}

// Automatic Zero-Point Offset Calibration
void handleCalibrate() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  long sumV = 0, sumI = 0;
  const int n = 500;

  for (int i = 0; i < n; i++) {
    sumV += analogRead(PIN_VOLTAGE_ADC);
    sumI += analogRead(PIN_CURRENT_ADC);
    delayMicroseconds(200);
  }

  voltZeroOffset = sumV / n;
  currZeroOffset = sumI / n;

  String json = "{";
  json += "\"status\":\"calibrated\",";
  json += "\"voltage_offset\":" + String(voltZeroOffset) + ",";
  json += "\"current_offset\":" + String(currZeroOffset);
  json += "}";

  server.send(200, "application/json", json);
  Serial.printf("[CALIB] New Offsets -> V: %d, I: %d\n", voltZeroOffset, currZeroOffset);
}

// Safe Reboot Endpoint
void handleRestart() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"rebooting\"}");
  delay(1000);
  ESP.restart();
}

// =====================================================================================
// 6. OPTIONAL CLOUD PUSH (HTTP POST to External Website)
// =====================================================================================
void pushTelemetryToCloud() {
#if ENABLE_CLOUD_PUSH
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(CLOUD_API_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"voltage\":" + String(voltageRMS, 2) + ",";
  payload += "\"current\":" + String(currentRMS, 3) + ",";
  payload += "\"power\":" + String(powerWatts, 2) + ",";
  payload += "\"energy_kwh\":" + String(energyKWh, 4) + ",";
  payload += "\"device_id\":\"ESP32-VYRA-01\"";
  payload += "}";

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    Serial.printf("[CLOUD] Pushed data to website. HTTP Code: %d\n", httpCode);
  } else {
    Serial.printf("[CLOUD] Push failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
#endif
}

// =====================================================================================
// 7. SETUP & LOOP
// =====================================================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n==================================================");
  Serial.println("  VYRA ESP32 Smart IoT Power & Sensor Monitor");
  Serial.println("==================================================");

  // Configure Pins
  pinMode(PIN_VOLTAGE_ADC, INPUT);
  pinMode(PIN_CURRENT_ADC, INPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Configure ESP32 ADC
  analogReadResolution(ADC_RESOLUTION);
  analogSetAttenuation(ADC_11db); // 0 - 3.3V range

  // Connect to Wi-Fi
  Serial.printf("[WIFI] Connecting to '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
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
    Serial.print("[WIFI] IP Address: http://");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
  } else {
    Serial.println("\n[WIFI] Router not found. Starting Fallback Access Point (AP)...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.print("[WIFI] Connect to Wi-Fi: ");
    Serial.println(AP_SSID);
    Serial.print("[WIFI] Open in browser: http://");
    Serial.println(WiFi.softAPIP());
  }

  // Start mDNS Responder (access via http://vyra-esp32.local)
  if (MDNS.begin(MDNS_NAME)) {
    Serial.printf("[mDNS] Started! Visit: http://%s.local\n", MDNS_NAME);
    MDNS.addService("http", "tcp", 80);
  }

  // Register Web Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/data", HTTP_GET, handleGetData);
  server.on("/api/calibrate", HTTP_GET, handleCalibrate);
  server.on("/api/restart", HTTP_GET, handleRestart);

  server.begin();
  Serial.println("[HTTP] Web server active on port 80");
  Serial.println("==================================================\n");

  lastEnergyCalc = millis();
}

void loop() {
  // Handle Web Server Client Requests
  server.handleClient();

  // Periodic Sensor Reading (every 1 second)
  unsigned long now = millis();
  if (now - lastSampleTime >= 1000) {
    lastSampleTime = now;
    performMeasurement();

    // Print to Serial Monitor
    Serial.printf("[LIVE] V: %6.1f V | I: %5.2f A | P: %6.1f W | E: %7.4f kWh\n",
                  voltageRMS, currentRMS, powerWatts, energyKWh);
  }

  // Periodic Cloud Push (every 5 seconds, if enabled)
  if (ENABLE_CLOUD_PUSH && (now - lastCloudPushTime >= 5000)) {
    lastCloudPushTime = now;
    pushTelemetryToCloud();
  }
}
