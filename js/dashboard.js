/* VYRA - Smart Grid Command Center Dashboard Simulation & Math Health Index Engine */
class VyraDashboard {
  constructor() {
    this.chart = null;
    this.activeMetric = 'voltage';
    this.isAnomalyActive = false;
    this.isUserFeedMode = false;
    this.isEsp32Active = false;
    this.esp32Poller = null;
    this.esp32FailCount = 0;
    this.esp32PacketCount = 0;
    this.esp32Ip = localStorage.getItem('vyra_esp32_ip') || '192.168.1.150';
    this.telemetryHistory = {
      labels: [],
      voltage: [],
      temperature: [],
      vibration: [],
      current: []
    };
    this.maxDataPoints = 15;

    this.initChart();
    this.startLiveStream();
    this.setupEventListeners();
    this.setupUserInputListeners();
    this.setupEsp32Bridge();
  }

  initChart() {
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;

    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.telemetryHistory.labels.push(timeStr);
      this.telemetryHistory.voltage.push(238 + Math.random() * 4 - 2);
      this.telemetryHistory.temperature.push(48.5 + Math.random() * 2 - 1);
      this.telemetryHistory.vibration.push(1.2 + Math.random() * 0.4 - 0.2);
      this.telemetryHistory.current.push(142 + Math.random() * 6 - 3);
    }

    const config = {
      type: 'line',
      data: {
        labels: this.telemetryHistory.labels,
        datasets: [{
          label: 'Voltage (V)',
          data: this.telemetryHistory.voltage,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00ff9d'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#00ff9d',
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  setupEventListeners() {
    document.querySelectorAll('.metric-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.metric-tab').forEach(t => {
          t.classList.remove('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-400');
          t.classList.add('border-transparent', 'text-slate-400');
        });

        const targetTab = e.currentTarget;
        targetTab.classList.add('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-400');
        targetTab.classList.remove('border-transparent', 'text-slate-400');

        this.activeMetric = targetTab.dataset.metric;
        this.updateChartDataset();
      });
    });

    const anomalyBtn = document.getElementById('toggleAnomalyBtn');
    if (anomalyBtn) {
      anomalyBtn.addEventListener('click', () => {
        this.isAnomalyActive = !this.isAnomalyActive;
        this.toggleAnomalyState();
      });
    }
  }

  setupUserInputListeners() {
    const toggleBtn = document.getElementById('btnToggleFeedMode');
    const calcBtn = document.getElementById('btnCalculateUserHealth');
    const inputs = ['inputTemp', 'inputVib', 'inputVolt', 'inputCurr', 'inputDga', 'inputMoisture'];

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isUserFeedMode = !this.isUserFeedMode;
        if (this.isUserFeedMode) {
          toggleBtn.className = 'px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 font-bold transition-all flex items-center gap-2';
          toggleBtn.innerHTML = `<i class="fa-solid fa-keyboard"></i> <span>User Feed Mode: Active</span>`;
          this.calculateUserFeedHealth();
        } else {
          toggleBtn.className = 'px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-2';
          toggleBtn.innerHTML = `<i class="fa-solid fa-wifi"></i> <span>Live IoT Stream Mode</span>`;
        }
      });
    }

    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        this.calculateUserFeedHealth();
      });
    }

    // Auto calculate on user typing/selecting when in manual mode
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (this.isUserFeedMode) {
            this.calculateUserFeedHealth();
          }
        });
      }
    });
  }

  /**
   * MATHEMATICAL TRANSFORMER HEALTH INDEX (HI) FORMULA
   * HI = 100 - (P_T + P_V + P_dV + P_I + P_DGA + P_Moisture)
   */
  calculateHealthIndex(temp, vib, volt, curr, pDga = 0, pMoisture = 0) {
    // 1. Temperature Penalty Factor (P_T)
    let pT = 0;
    if (temp > 50) {
      pT = Math.pow((temp - 50) / 35, 1.8) * 45;
    }

    // 2. Vibration Penalty Factor (P_V)
    let pV = 0;
    if (vib > 1.5) {
      pV = Math.pow((vib - 1.5) / 3.5, 1.5) * 35;
    }

    // 3. Voltage Deviation Penalty Factor (P_dV)
    const devVolt = Math.abs(volt - 240);
    const pdV = (devVolt / 240) * 100 * 1.5;

    // 4. Current Load Penalty Factor (P_I)
    let pI = 0;
    if (curr > 140) {
      pI = Math.pow((curr - 140) / 60, 1.5) * 25;
    }

    const totalPenalty = pT + pV + pdV + pI + pDga + pMoisture;
    let healthIndex = 100 - totalPenalty;
    healthIndex = Math.max(0, Math.min(100, healthIndex));

    return {
      healthIndex: parseFloat(healthIndex.toFixed(1)),
      pT: parseFloat(pT.toFixed(1)),
      pV: parseFloat(pV.toFixed(1)),
      pdV: parseFloat(pdV.toFixed(1)),
      pI: parseFloat(pI.toFixed(1)),
      pDga: parseFloat(pDga.toFixed(1)),
      pMoisture: parseFloat(pMoisture.toFixed(1)),
      totalPenalty: parseFloat(totalPenalty.toFixed(1))
    };
  }

  calculateUserFeedHealth() {
    const temp = parseFloat(document.getElementById('inputTemp')?.value || 48.5);
    const vib = parseFloat(document.getElementById('inputVib')?.value || 1.24);
    const volt = parseFloat(document.getElementById('inputVolt')?.value || 238.4);
    const curr = parseFloat(document.getElementById('inputCurr')?.value || 142.0);
    const pDga = parseFloat(document.getElementById('inputDga')?.value || 0);
    const pMoisture = parseFloat(document.getElementById('inputMoisture')?.value || 0);

    const mathResult = this.calculateHealthIndex(temp, vib, volt, curr, pDga, pMoisture);

    // Push calculation step to telemetry history
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.telemetryHistory.labels.push(timeStr);
    this.telemetryHistory.voltage.push(volt);
    this.telemetryHistory.temperature.push(temp);
    this.telemetryHistory.vibration.push(vib);
    this.telemetryHistory.current.push(curr);

    if (this.telemetryHistory.labels.length > this.maxDataPoints) {
      this.telemetryHistory.labels.shift();
      this.telemetryHistory.voltage.shift();
      this.telemetryHistory.temperature.shift();
      this.telemetryHistory.vibration.shift();
      this.telemetryHistory.current.shift();
    }

    this.updateTelemetryValues(volt, temp, vib, curr, mathResult);
    if (this.chart) this.chart.update();

    // Alert notification for user feed calculation
    this.injectAlert(`⚙ User Feed Math Calculated — Health Index: ${mathResult.healthIndex}% (Temp: ${temp}°C, Vib: ${vib}mm/s, Volt: ${volt}V)`, mathResult.healthIndex < 65 ? 'rose' : 'emerald');
  }

  startLiveStream() {
    setInterval(() => {
      if (this.isUserFeedMode || this.isEsp32Active) return; // Skip simulated ticks when manual user feed or physical ESP32 mode is active

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const lastVolt = this.telemetryHistory.voltage[this.telemetryHistory.voltage.length - 1];
      const lastTemp = this.telemetryHistory.temperature[this.telemetryHistory.temperature.length - 1];
      const lastVib = this.telemetryHistory.vibration[this.telemetryHistory.vibration.length - 1];
      const lastCurr = this.telemetryHistory.current[this.telemetryHistory.current.length - 1];

      let nextVolt = lastVolt + (Math.random() - 0.5) * 1.5;
      let nextTemp = lastTemp + (Math.random() - 0.48) * 0.4;
      let nextVib = lastVib + (Math.random() - 0.5) * 0.1;
      let nextCurr = lastCurr + (Math.random() - 0.5) * 2;

      if (this.isAnomalyActive) {
        nextTemp += 2.5;
        nextVib += 0.8;
        nextCurr += 12;
      }

      nextVolt = Math.max(215, Math.min(255, nextVolt));
      nextTemp = Math.max(35, Math.min(85, nextTemp));
      nextVib = Math.max(0.5, Math.min(5.0, nextVib));
      nextCurr = Math.max(100, Math.min(200, nextCurr));

      this.telemetryHistory.labels.push(timeStr);
      this.telemetryHistory.voltage.push(nextVolt);
      this.telemetryHistory.temperature.push(nextTemp);
      this.telemetryHistory.vibration.push(nextVib);
      this.telemetryHistory.current.push(nextCurr);

      if (this.telemetryHistory.labels.length > this.maxDataPoints) {
        this.telemetryHistory.labels.shift();
        this.telemetryHistory.voltage.shift();
        this.telemetryHistory.temperature.shift();
        this.telemetryHistory.vibration.shift();
        this.telemetryHistory.current.shift();
      }

      const mathResult = this.calculateHealthIndex(nextTemp, nextVib, nextVolt, nextCurr);

      // Sync form input fields with live stream
      const elInputTemp = document.getElementById('inputTemp');
      const elInputVib = document.getElementById('inputVib');
      const elInputVolt = document.getElementById('inputVolt');
      const elInputCurr = document.getElementById('inputCurr');

      if (elInputTemp) elInputTemp.value = nextTemp.toFixed(1);
      if (elInputVib) elInputVib.value = nextVib.toFixed(2);
      if (elInputVolt) elInputVolt.value = nextVolt.toFixed(1);
      if (elInputCurr) elInputCurr.value = nextCurr.toFixed(1);

      this.updateTelemetryValues(nextVolt, nextTemp, nextVib, nextCurr, mathResult);
      if (this.chart) this.chart.update('none');
    }, 2000);
  }

  updateTelemetryValues(volt, temp, vib, curr, mathResult) {
    const elVolt = document.getElementById('valVoltage');
    const elTemp = document.getElementById('valTemperature');
    const elVib = document.getElementById('valVibration');
    const elCurr = document.getElementById('valCurrent');

    if (elVolt) elVolt.textContent = `${volt.toFixed(1)} V`;
    if (elTemp) elTemp.textContent = `${temp.toFixed(1)} °C`;
    if (elVib) elVib.textContent = `${vib.toFixed(2)} mm/s`;
    if (elCurr) elCurr.textContent = `${curr.toFixed(1)} A`;

    if (mathResult) {
      const rulText = document.getElementById('rulPercentageText');
      const rulCircle = document.getElementById('rulCircleVal');
      const formulaVal = document.getElementById('calculatedHealthScoreVal');
      const formulaBreakdown = document.getElementById('penaltyBreakdownText');
      const statusText = document.getElementById('transformerStatusText');

      if (rulText) rulText.textContent = `${mathResult.healthIndex}%`;

      if (rulCircle) {
        const offset = 283 * (1 - mathResult.healthIndex / 100);
        rulCircle.style.strokeDashoffset = `${offset}`;
      }

      if (formulaVal) {
        formulaVal.textContent = `HI = ${mathResult.healthIndex}%`;
        if (mathResult.healthIndex < 65) {
          formulaVal.className = 'text-rose-400 font-bold text-sm';
        } else if (mathResult.healthIndex < 80) {
          formulaVal.className = 'text-amber-400 font-bold text-sm';
        } else {
          formulaVal.className = 'text-emerald-400 font-bold text-sm';
        }
      }

      if (formulaBreakdown) {
        formulaBreakdown.innerHTML = `P<sub>T</sub>=${mathResult.pT}, P<sub>V</sub>=${mathResult.pV}, P<sub>ΔV</sub>=${mathResult.pdV}, P<sub>I</sub>=${mathResult.pI}, P<sub>DGA</sub>=${mathResult.pDga}, P<sub>Moi</sub>=${mathResult.pMoisture} (Total Loss: ${mathResult.totalPenalty}%)`;
      }

      if (statusText) {
        if (mathResult.healthIndex < 65) {
          statusText.textContent = 'CRITICAL WARNING';
          statusText.className = 'text-xs font-semibold uppercase tracking-wider text-rose-400 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 animate-pulse';
        } else if (mathResult.healthIndex < 82) {
          statusText.textContent = 'WARNING / ELEVATED';
          statusText.className = 'text-xs font-semibold uppercase tracking-wider text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20';
        } else {
          statusText.textContent = 'HEALTHY';
          statusText.className = 'text-xs font-semibold uppercase tracking-wider text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20';
        }
      }
    }
  }

  toggleAnomalyState() {
    const badge = document.getElementById('theftAnomalyBadge');
    const btn = document.getElementById('toggleAnomalyBtn');

    if (this.isAnomalyActive) {
      if (badge) {
        badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-2';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> ⚠ ANOMALY DETECTED: Theft / Imbalance Risk`;
      }
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Reset Grid Simulation`;
        btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all';
      }
      this.injectAlert('⚠ CRITICAL: Energy imbalance detected in Zone 7 (High Theft Risk Flagged)', 'rose');
    } else {
      if (badge) {
        badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Energy Balance Normal`;
      }
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-bolt-lightning"></i> Simulate Grid Anomaly / Theft`;
        btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all';
      }
      this.injectAlert('✓ Grid parameters normalized — Smart Intelligence Engine re-established baseline balance', 'emerald');
    }
  }

  injectAlert(msg, colorType) {
    const alertFeed = document.getElementById('liveAlertFeed');
    if (!alertFeed) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const div = document.createElement('div');
    const colorClasses = colorType === 'rose' 
      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    
    div.className = `p-3 rounded-lg border ${colorClasses} text-xs flex items-center justify-between gap-3 animate-fade-in`;
    div.innerHTML = `
      <span>${msg}</span>
      <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
    `;

    alertFeed.prepend(div);
    if (alertFeed.children.length > 6) {
      alertFeed.removeChild(alertFeed.lastChild);
    }
  }

  /* ESP32 Hardware Bridge Methods */
  setupEsp32Bridge() {
    const btnToggleBar = document.getElementById('btnToggleEsp32Bar');
    const bridgePanel = document.getElementById('esp32BridgePanel');
    const inputIp = document.getElementById('inputEsp32Ip');
    const btnConnect = document.getElementById('btnConnectEsp32');
    const linkDashboard = document.getElementById('linkEsp32Dashboard');

    if (inputIp) {
      inputIp.value = this.esp32Ip;
      inputIp.addEventListener('input', () => {
        const val = inputIp.value.trim();
        if (linkDashboard) {
          linkDashboard.href = val.startsWith('http') ? val : `http://${val}`;
        }
      });
    }

    if (linkDashboard && inputIp) {
      linkDashboard.href = `http://${this.esp32Ip}`;
    }

    if (btnToggleBar && bridgePanel) {
      btnToggleBar.addEventListener('click', () => {
        bridgePanel.classList.toggle('hidden');
      });
    }

    if (btnConnect) {
      btnConnect.addEventListener('click', () => {
        if (this.isEsp32Active || this.esp32Poller) {
          this.disconnectEsp32();
        } else {
          const ip = (inputIp?.value || '192.168.1.150').trim();
          this.connectEsp32(ip);
        }
      });
    }
  }

  connectEsp32(targetIp) {
    const statusBadge = document.getElementById('esp32StatusBadge');
    const statusText = document.getElementById('esp32StatusText');
    const dot = document.getElementById('esp32Dot');
    const labelConnect = document.getElementById('labelConnectEsp32');
    const iconConnect = document.getElementById('iconConnectEsp32');
    const linkDashboard = document.getElementById('linkEsp32Dashboard');

    let cleanHost = targetIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    this.esp32Ip = cleanHost;
    localStorage.setItem('vyra_esp32_ip', cleanHost);

    if (linkDashboard) {
      linkDashboard.href = `http://${cleanHost}`;
    }

    if (statusBadge) {
      statusBadge.textContent = 'CONNECTING...';
      statusBadge.className = 'text-amber-400 font-bold';
    }
    if (dot) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
    }
    if (statusText) {
      statusText.textContent = `Polling http://${cleanHost}/api/data...`;
    }
    if (labelConnect) labelConnect.textContent = 'Disconnect ESP32';
    if (iconConnect) iconConnect.className = 'fa-solid fa-spinner fa-spin';

    this.esp32FailCount = 0;
    this.esp32PacketCount = 0;

    // Immediately poll once, then every 1000ms
    this.pollEsp32Data(cleanHost);
    this.esp32Poller = setInterval(() => {
      this.pollEsp32Data(cleanHost);
    }, 1000);
  }

  async pollEsp32Data(host) {
    const statusBadge = document.getElementById('esp32StatusBadge');
    const statusText = document.getElementById('esp32StatusText');
    const dot = document.getElementById('esp32Dot');
    const iconConnect = document.getElementById('iconConnectEsp32');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const url = `http://${host}/api/data`;

      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      this.esp32FailCount = 0;
      this.esp32PacketCount++;

      if (!this.isEsp32Active) {
        this.isEsp32Active = true;
        this.injectAlert(`🔌 ESP32 Connected! Streaming live hardware telemetry from ${host}`, 'emerald');
      }

      if (statusBadge) {
        statusBadge.textContent = 'LIVE HARDWARE STREAM';
        statusBadge.className = 'text-emerald-400 font-bold';
      }
      if (dot) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]';
      }
      if (iconConnect) iconConnect.className = 'fa-solid fa-link';
      if (statusText) {
        statusText.textContent = `Streaming: ${data.voltage.toFixed(1)}V, ${data.current.toFixed(2)}A | Power: ${data.power.toFixed(1)}W | RSSI: ${data.rssi || '--'} dBm (Packets: ${this.esp32PacketCount})`;
      }

      // Sync form input fields
      const elInputVolt = document.getElementById('inputVolt');
      const elInputCurr = document.getElementById('inputCurr');
      if (elInputVolt) elInputVolt.value = data.voltage.toFixed(1);
      if (elInputCurr) elInputCurr.value = data.current.toFixed(2);

      // Read baseline temp & vib from form
      const temp = parseFloat(document.getElementById('inputTemp')?.value || 48.5);
      const vib = parseFloat(document.getElementById('inputVib')?.value || 1.24);
      const pDga = parseFloat(document.getElementById('inputDga')?.value || 0);
      const pMoisture = parseFloat(document.getElementById('inputMoisture')?.value || 0);

      const mathResult = this.calculateHealthIndex(temp, vib, data.voltage, data.current, pDga, pMoisture);

      // Push to telemetry history
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      this.telemetryHistory.labels.push(timeStr);
      this.telemetryHistory.voltage.push(data.voltage);
      this.telemetryHistory.temperature.push(temp);
      this.telemetryHistory.vibration.push(vib);
      this.telemetryHistory.current.push(data.current);

      if (this.telemetryHistory.labels.length > this.maxDataPoints) {
        this.telemetryHistory.labels.shift();
        this.telemetryHistory.voltage.shift();
        this.telemetryHistory.temperature.shift();
        this.telemetryHistory.vibration.shift();
        this.telemetryHistory.current.shift();
      }

      this.updateTelemetryValues(data.voltage, temp, vib, data.current, mathResult);
      if (this.chart) this.chart.update('none');

    } catch (err) {
      this.esp32FailCount++;
      if (this.esp32FailCount >= 3) {
        if (statusBadge) {
          statusBadge.textContent = 'UNREACHABLE / TIMEOUT';
          statusBadge.className = 'text-rose-400 font-bold';
        }
        if (dot) {
          dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse';
        }
        if (statusText) {
          statusText.textContent = `Cannot reach http://${host}/api/data. Ensure ESP32 and this device are on the same Wi-Fi.`;
        }
      }
    }
  }

  disconnectEsp32() {
    if (this.esp32Poller) {
      clearInterval(this.esp32Poller);
      this.esp32Poller = null;
    }
    this.isEsp32Active = false;

    const statusBadge = document.getElementById('esp32StatusBadge');
    const statusText = document.getElementById('esp32StatusText');
    const dot = document.getElementById('esp32Dot');
    const labelConnect = document.getElementById('labelConnectEsp32');
    const iconConnect = document.getElementById('iconConnectEsp32');

    if (statusBadge) {
      statusBadge.textContent = 'DISCONNECTED';
      statusBadge.className = 'text-slate-400 font-bold';
    }
    if (dot) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-500';
    }
    if (statusText) {
      statusText.textContent = 'Enter ESP32 IP or mDNS hostname to read real-time voltage and current sensors';
    }
    if (labelConnect) labelConnect.textContent = 'Connect ESP32';
    if (iconConnect) iconConnect.className = 'fa-solid fa-plug';

    this.injectAlert('Disconnected from ESP32. Resumed simulated IoT telemetry stream.', 'emerald');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.vyraDashboard = new VyraDashboard();
});
