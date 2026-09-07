#ifndef WEB_PAGE_H
#define WEB_PAGE_H

#include <pgmspace.h>

const char MAIN_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VYRA — ESP32 Sensor Web Dashboard</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(15, 23, 42, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent-green: #10b981;
      --accent-cyan: #06b6d4;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse at top, rgba(16, 185, 129, 0.08) 0%, transparent 60%),
        radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.06) 0%, transparent 50%);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 1100px;
    }

    /* HEADER */
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 2rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
    }

    .brand-icon svg {
      width: 24px;
      height: 24px;
      fill: #030712;
    }

    .brand-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #ffffff, #a7f3d0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 0.8rem;
      font-family: var(--font-mono);
      color: #34d399;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* GRID */
    .grid-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .card-volt::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .card-curr::before { background: linear-gradient(90deg, #06b6d4, #38bdf8); }
    .card-power::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .card-energy::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .card-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }

    .card-badge {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
    }

    .card-value {
      font-family: var(--font-mono);
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }

    .card-unit {
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .card-subtext {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      display: flex;
      justify-content: space-between;
    }

    /* CHART SECTION */
    .section-chart {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    canvas#trendCanvas {
      width: 100%;
      height: 180px;
      border-radius: 8px;
    }

    /* DIAGNOSTICS & SYSTEM INFO */
    .grid-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .info-box {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1rem;
    }

    .info-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .info-val {
      font-family: var(--font-mono);
      font-size: 1rem;
      color: var(--text-main);
      font-weight: 600;
    }

    /* ACTIONS */
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 2rem;
    }

    .btn {
      appearance: none;
      border: 1px solid var(--card-border);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-family: var(--font-sans);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-primary {
      background: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.4);
      color: #34d399;
    }

    .btn-primary:hover {
      background: rgba(16, 185, 129, 0.3);
      border-color: rgba(16, 185, 129, 0.6);
    }

    /* FOOTER */
    footer {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      padding: 1.5rem 0;
      border-top: 1px solid var(--card-border);
      width: 100%;
    }

    footer a {
      color: var(--accent-green);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <header>
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div>
          <div class="brand-title">VYRA IoT Node</div>
          <div class="brand-subtitle">ESP32 Voltage & Current Live Monitor</div>
        </div>
      </div>
      <div class="status-pill">
        <div class="status-dot" id="liveDot"></div>
        <span id="connectionStatus">CONNECTED (WiFi)</span>
      </div>
    </header>

    <!-- METRICS GRID -->
    <div class="grid-metrics">
      <!-- Voltage -->
      <div class="card card-volt">
        <div class="card-header">
          <span class="card-label">AC Voltage (RMS)</span>
          <span class="card-badge" id="badgeVoltMode">GPIO 34</span>
        </div>
        <div class="card-value" style="color: #34d399;">
          <span id="dispVoltage">0.0</span>
          <span class="card-unit">V</span>
        </div>
        <div class="card-subtext">
          <span>ADC: <strong id="dispRawVolt">-</strong></span>
          <span>Peak: <strong id="dispPeakVolt">0.0V</strong></span>
        </div>
      </div>

      <!-- Current -->
      <div class="card card-curr">
        <div class="card-header">
          <span class="card-label">AC Current (RMS)</span>
          <span class="card-badge" id="badgeCurrMode">GPIO 35</span>
        </div>
        <div class="card-value" style="color: #38bdf8;">
          <span id="dispCurrent">0.00</span>
          <span class="card-unit">A</span>
        </div>
        <div class="card-subtext">
          <span>ADC: <strong id="dispRawCurr">-</strong></span>
          <span>Peak: <strong id="dispPeakCurr">0.00A</strong></span>
        </div>
      </div>

      <!-- Power -->
      <div class="card card-power">
        <div class="card-header">
          <span class="card-label">Active Power</span>
          <span class="card-badge">P = V × I</span>
        </div>
        <div class="card-value" style="color: #fbbf24;">
          <span id="dispPower">0.0</span>
          <span class="card-unit">W</span>
        </div>
        <div class="card-subtext">
          <span>Apparent: <strong id="dispPowerKW">0.000 kW</strong></span>
          <span>Grid: <strong>50 Hz</strong></span>
        </div>
      </div>

      <!-- Energy -->
      <div class="card card-energy">
        <div class="card-header">
          <span class="card-label">Accumulated Energy</span>
          <span class="card-badge">kWh</span>
        </div>
        <div class="card-value" style="color: #a78bfa;">
          <span id="dispEnergy">0.000</span>
          <span class="card-unit">kWh</span>
        </div>
        <div class="card-subtext">
          <span>Watt-hours: <strong id="dispEnergyWh">0 Wh</strong></span>
          <span>Session Meter</span>
        </div>
      </div>
    </div>

    <!-- LIVE TELEMETRY GRAPH -->
    <div class="section-chart">
      <div class="section-header">
        <div class="section-title">Real-Time Waveform & Telemetry Trend</div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
          Polling rate: 1000ms | <span id="lastUpdateText">Connecting...</span>
        </div>
      </div>
      <canvas id="trendCanvas"></canvas>
    </div>

    <!-- DIAGNOSTICS -->
    <div class="grid-info">
      <div class="info-box">
        <div class="info-label">Wi-Fi Network</div>
        <div class="info-val" id="dispSSID">--</div>
      </div>
      <div class="info-box">
        <div class="info-label">Signal Strength (RSSI)</div>
        <div class="info-val" id="dispRSSI">-- dBm</div>
      </div>
      <div class="info-box">
        <div class="info-label">ESP32 IP Address</div>
        <div class="info-val" id="dispIP">--</div>
      </div>
      <div class="info-box">
        <div class="info-label">System Uptime</div>
        <div class="info-val" id="dispUptime">00:00:00</div>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <a href="/api/data" target="_blank" class="btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Raw JSON API
      </a>
      <button class="btn btn-primary" id="btnCalibrate" onclick="calibrateSensors()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        Zero Calibrate Offsets
      </button>
      <button class="btn" onclick="restartESP32()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        Reboot ESP32
      </button>
    </div>

    <!-- FOOTER -->
    <footer>
      VYRA Smart Grid IoT Node &bull; Dual-mode AC/DC Telemetry &bull; Powered by ESP32 Microcontroller
    </footer>
  </div>

  <script>
    // Live Canvas Trend Graph
    const canvas = document.getElementById('trendCanvas');
    const ctx = canvas.getContext('2d');
    const voltHistory = [];
    const currHistory = [];
    const maxPoints = 40;

    function resizeCanvas() {
      canvas.width = canvas.parentElement.clientWidth - 48;
      canvas.height = 160;
      drawChart();
    }
    window.addEventListener('resize', resizeCanvas);

    function drawChart() {
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 20; y < h; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (voltHistory.length < 2) return;

      const step = w / (maxPoints - 1);

      // Draw Voltage line (Green)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < voltHistory.length; i++) {
        // Map 0V - 300V to h-10 -> 10
        const y = h - 10 - ((voltHistory[i] / 300) * (h - 25));
        const x = i * step;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Current line (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      for (let i = 0; i < currHistory.length; i++) {
        // Map 0A - 30A to h-10 -> 10
        const y = h - 10 - ((currHistory[i] / 30) * (h - 25));
        const x = i * step;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Telemetry Poller
    let failCount = 0;
    async function updateTelemetry() {
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        // Update displays
        document.getElementById('dispVoltage').textContent = data.voltage.toFixed(1);
        document.getElementById('dispCurrent').textContent = data.current.toFixed(2);
        document.getElementById('dispPower').textContent = data.power.toFixed(1);
        document.getElementById('dispPowerKW').textContent = (data.power / 1000).toFixed(3) + ' kW';
        document.getElementById('dispEnergy').textContent = data.energy_kwh.toFixed(3);
        document.getElementById('dispEnergyWh').textContent = (data.energy_kwh * 1000).toFixed(1) + ' Wh';

        document.getElementById('dispRawVolt').textContent = data.raw_voltage_adc;
        document.getElementById('dispRawCurr').textContent = data.raw_current_adc;
        document.getElementById('dispPeakVolt').textContent = (data.voltage * 1.414).toFixed(1) + 'V';
        document.getElementById('dispPeakCurr').textContent = (data.current * 1.414).toFixed(2) + 'A';

        document.getElementById('dispSSID').textContent = data.ssid || 'Connected';
        document.getElementById('dispRSSI').textContent = data.rssi + ' dBm';
        document.getElementById('dispIP').textContent = data.ip || window.location.hostname;
        
        // Format uptime
        const sec = data.uptime_sec || 0;
        const hrs = String(Math.floor(sec / 3600)).padStart(2, '0');
        const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const secs = String(sec % 60).padStart(2, '0');
        document.getElementById('dispUptime').textContent = `${hrs}:${mins}:${secs}`;

        // Status
        document.getElementById('connectionStatus').textContent = 'ONLINE (Live IoT)';
        document.getElementById('liveDot').style.background = '#10b981';
        document.getElementById('lastUpdateText').textContent = 'Updated ' + new Date().toLocaleTimeString();
        failCount = 0;

        // Push to history
        voltHistory.push(data.voltage);
        currHistory.push(data.current);
        if (voltHistory.length > maxPoints) {
          voltHistory.shift();
          currHistory.shift();
        }
        drawChart();
      } catch (err) {
        failCount++;
        if (failCount > 2) {
          document.getElementById('connectionStatus').textContent = 'RECONNECTING...';
          document.getElementById('liveDot').style.background = '#f43f5e';
        }
      }
    }

    async function calibrateSensors() {
      const btn = document.getElementById('btnCalibrate');
      btn.textContent = 'Calibrating...';
      try {
        const res = await fetch('/api/calibrate');
        const json = await res.json();
        alert('Calibration Complete!\nNew Zero Offsets:\nVoltage: ' + json.voltage_offset + '\nCurrent: ' + json.current_offset);
      } catch (e) {
        alert('Calibration request failed: ' + e.message);
      } finally {
        btn.textContent = 'Zero Calibrate Offsets';
      }
    }

    async function restartESP32() {
      if (confirm('Are you sure you want to restart the ESP32?')) {
        try {
          await fetch('/api/restart');
          alert('ESP32 is rebooting. The page will reload in 5 seconds.');
          setTimeout(() => window.location.reload(), 5000);
        } catch (e) {
          window.location.reload();
        }
      }
    }

    // Initialize
    resizeCanvas();
    updateTelemetry();
    setInterval(updateTelemetry, 1000);
  </script>
</body>
</html>
)rawliteral";

#endif // WEB_PAGE_H
