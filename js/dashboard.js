/* VYRA - Smart Grid Command Center Dashboard Simulation & Sensor Telemetry Engine */
class VyraDashboard {
  constructor() {
    this.charts = {
      health: null,
      voltage: null,
      temperature: null,
      vibration: null,
      current: null
    };

    this.isAnomalyActive = false;
    this.isUserFeedMode = false;
    this.maxDataPoints = 16;

    this.telemetryHistory = {
      labels: [],
      health: [],
      voltage: [],
      temperature: [],
      vibration: [],
      current: []
    };

    this.initHistoryBuffer();
    this.initMainHealthChart();
    this.initSensorCharts();
    this.startLiveStream();
    this.setupEventListeners();
    this.setupUserInputListeners();
  }

  initHistoryBuffer() {
    const now = new Date();
    for (let i = this.maxDataPoints - 1; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 2500).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const volt = 238.4 + (Math.sin(i) * 1.6);
      const temp = 48.5 + (Math.sin(i * 0.8) * 0.7);
      const vib = 1.24 + (Math.sin(i * 1.1) * 0.08);
      const curr = 142.0 + (Math.cos(i) * 3.2);

      const mathRes = this.calculateHealthIndex(temp, vib, volt, curr, 0, 0);

      this.telemetryHistory.labels.push(timeStr);
      this.telemetryHistory.health.push(mathRes.healthIndex);
      this.telemetryHistory.voltage.push(parseFloat(volt.toFixed(1)));
      this.telemetryHistory.temperature.push(parseFloat(temp.toFixed(1)));
      this.telemetryHistory.vibration.push(parseFloat(vib.toFixed(2)));
      this.telemetryHistory.current.push(parseFloat(curr.toFixed(1)));
    }
  }

  // ==================== 1. MAIN TRANSFORMER HEALTH GRAPH ====================
  initMainHealthChart() {
    const ctx = document.getElementById('mainHealthChart');
    if (!ctx) return;

    const chartCtx = ctx.getContext('2d');
    const gradient = chartCtx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 255, 157, 0.3)');
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    this.charts.health = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.telemetryHistory.labels,
        datasets: [
          {
            label: 'Health Index (HI %)',
            data: this.telemetryHistory.health,
            borderColor: '#00ff9d',
            backgroundColor: gradient,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointBackgroundColor: '#00ff9d',
            pointBorderColor: '#030712',
            pointBorderWidth: 1.5
          },
          {
            label: 'Normal (85%)',
            data: Array(this.maxDataPoints).fill(85),
            borderColor: 'rgba(16, 185, 129, 0.35)',
            borderWidth: 1.2,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Warning (65%)',
            data: Array(this.maxDataPoints).fill(65),
            borderColor: 'rgba(245, 158, 11, 0.35)',
            borderWidth: 1.2,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              boxHeight: 2,
              color: '#94a3b8',
              font: { size: 9, family: 'monospace' },
              filter: (item) => item.text !== 'Normal (85%)' && item.text !== 'Warning (65%)'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#00ff9d',
            padding: 8,
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 0) return ` Health Index: ${context.parsed.y}%`;
                return null;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#64748b', font: { size: 9, family: 'monospace' }, maxTicksLimit: 8 }
          },
          y: {
            min: 30,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 9, family: 'monospace' },
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });
  }

  // ==================== 2. INDIVIDUAL SENSOR GRAPHS ====================
  initSensorCharts() {
    // 1. Voltage Sensor Graph
    const ctxVolt = document.getElementById('sensorVoltageChart');
    if (ctxVolt) {
      this.charts.voltage = this.createSensorChart(ctxVolt, {
        label: 'Voltage (V)',
        data: this.telemetryHistory.voltage,
        color: '#10b981',
        fillColor: 'rgba(16, 185, 129, 0.12)',
        pointColor: '#00ff9d',
        unit: 'V',
        min: 210,
        max: 260
      });
    }

    // 2. Temperature Sensor Graph
    const ctxTemp = document.getElementById('sensorTempChart');
    if (ctxTemp) {
      this.charts.temperature = this.createSensorChart(ctxTemp, {
        label: 'Temperature (°C)',
        data: this.telemetryHistory.temperature,
        color: '#f59e0b',
        fillColor: 'rgba(245, 158, 11, 0.12)',
        pointColor: '#fbbf24',
        unit: '°C',
        min: 30,
        max: 95
      });
    }

    // 3. Vibration Sensor Graph
    const ctxVib = document.getElementById('sensorVibChart');
    if (ctxVib) {
      this.charts.vibration = this.createSensorChart(ctxVib, {
        label: 'Vibration (mm/s)',
        data: this.telemetryHistory.vibration,
        color: '#3b82f6',
        fillColor: 'rgba(59, 130, 246, 0.12)',
        pointColor: '#60a5fa',
        unit: 'mm/s',
        min: 0.5,
        max: 5.5
      });
    }

    // 4. Current Sensor Graph
    const ctxCurr = document.getElementById('sensorCurrChart');
    if (ctxCurr) {
      this.charts.current = this.createSensorChart(ctxCurr, {
        label: 'Current (A)',
        data: this.telemetryHistory.current,
        color: '#06b6d4',
        fillColor: 'rgba(6, 182, 212, 0.12)',
        pointColor: '#22d3ee',
        unit: 'A',
        min: 90,
        max: 210
      });
    }
  }

  createSensorChart(canvas, opts) {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.telemetryHistory.labels,
        datasets: [{
          label: opts.label,
          data: opts.data,
          borderColor: opts.color,
          backgroundColor: opts.fillColor,
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          pointBackgroundColor: opts.pointColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: opts.color,
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: opts.color,
            padding: 8,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${opts.label}: ${context.parsed.y} ${opts.unit}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#64748b', font: { size: 9, family: 'monospace' }, maxTicksLimit: 5 }
          },
          y: {
            min: opts.min,
            max: opts.max,
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 9, family: 'monospace' },
              callback: (v) => `${v}${opts.unit ? ' ' + opts.unit : ''}`
            }
          }
        }
      }
    });
  }

  // ==================== 3. MATHEMATICAL HEALTH FORMULA ====================
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

  // ==================== 4. LIVE TELEMETRY STREAM ====================
  startLiveStream() {
    setInterval(() => {
      if (this.isUserFeedMode) return; // Skip ticks in manual mode

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const lastVolt = this.telemetryHistory.voltage[this.telemetryHistory.voltage.length - 1] || 238.4;
      const lastTemp = this.telemetryHistory.temperature[this.telemetryHistory.temperature.length - 1] || 48.5;
      const lastVib = this.telemetryHistory.vibration[this.telemetryHistory.vibration.length - 1] || 1.24;
      const lastCurr = this.telemetryHistory.current[this.telemetryHistory.current.length - 1] || 142.0;

      let nextVolt = lastVolt + (Math.random() - 0.5) * 1.5;
      let nextTemp = lastTemp + (Math.random() - 0.48) * 0.4;
      let nextVib = lastVib + (Math.random() - 0.5) * 0.08;
      let nextCurr = lastCurr + (Math.random() - 0.5) * 2.2;

      let pDga = 0;
      let pMoi = 0;

      if (this.isAnomalyActive) {
        nextVolt = Math.max(212, nextVolt - 2.5);
        nextTemp = Math.min(88, nextTemp + 2.8);
        nextVib = Math.min(4.8, nextVib + 0.5);
        nextCurr = Math.min(195, nextCurr + 5.0);
        pDga = 25;
        pMoi = 15;
      } else {
        nextVolt = Math.max(234, Math.min(244, nextVolt));
        nextTemp = Math.max(45, Math.min(52, nextTemp));
        nextVib = Math.max(0.9, Math.min(1.4, nextVib));
        nextCurr = Math.max(130, Math.min(150, nextCurr));
      }

      const mathResult = this.calculateHealthIndex(nextTemp, nextVib, nextVolt, nextCurr, pDga, pMoi);

      this.pushDataPoint(timeStr, mathResult.healthIndex, nextVolt, nextTemp, nextVib, nextCurr);

      // Sync form fields
      const elInputTemp = document.getElementById('inputTemp');
      const elInputVib = document.getElementById('inputVib');
      const elInputVolt = document.getElementById('inputVolt');
      const elInputCurr = document.getElementById('inputCurr');

      if (elInputTemp) elInputTemp.value = nextTemp.toFixed(1);
      if (elInputVib) elInputVib.value = nextVib.toFixed(2);
      if (elInputVolt) elInputVolt.value = nextVolt.toFixed(1);
      if (elInputCurr) elInputCurr.value = nextCurr.toFixed(1);

      this.updateUI(nextVolt, nextTemp, nextVib, nextCurr, mathResult);
      this.updateCharts();
    }, 2000);
  }

  pushDataPoint(timeStr, health, volt, temp, vib, curr) {
    this.telemetryHistory.labels.push(timeStr);
    this.telemetryHistory.health.push(health);
    this.telemetryHistory.voltage.push(parseFloat(volt.toFixed(1)));
    this.telemetryHistory.temperature.push(parseFloat(temp.toFixed(1)));
    this.telemetryHistory.vibration.push(parseFloat(vib.toFixed(2)));
    this.telemetryHistory.current.push(parseFloat(curr.toFixed(1)));

    if (this.telemetryHistory.labels.length > this.maxDataPoints) {
      this.telemetryHistory.labels.shift();
      this.telemetryHistory.health.shift();
      this.telemetryHistory.voltage.shift();
      this.telemetryHistory.temperature.shift();
      this.telemetryHistory.vibration.shift();
      this.telemetryHistory.current.shift();
    }
  }

  // ==================== 5. USER MANUAL FEED ====================
  calculateUserFeedHealth() {
    const temp = parseFloat(document.getElementById('inputTemp')?.value || 48.5);
    const vib = parseFloat(document.getElementById('inputVib')?.value || 1.24);
    const volt = parseFloat(document.getElementById('inputVolt')?.value || 238.4);
    const curr = parseFloat(document.getElementById('inputCurr')?.value || 142.0);
    const pDga = parseFloat(document.getElementById('inputDga')?.value || 0);
    const pMoisture = parseFloat(document.getElementById('inputMoisture')?.value || 0);

    const mathResult = this.calculateHealthIndex(temp, vib, volt, curr, pDga, pMoisture);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.pushDataPoint(timeStr, mathResult.healthIndex, volt, temp, vib, curr);
    this.updateUI(volt, temp, vib, curr, mathResult);
    this.updateCharts();

    this.injectAlert(
      `⚙ User Sensor Feed Computed — HI: ${mathResult.healthIndex}% (Temp: ${temp}°C, Vib: ${vib}mm/s, Volt: ${volt}V, Current: ${curr}A)`,
      mathResult.healthIndex < 65 ? 'rose' : (mathResult.healthIndex < 82 ? 'amber' : 'emerald')
    );
  }

  // ==================== 6. UI & CHARTS DISPATCHER ====================
  updateUI(volt, temp, vib, curr, mathResult) {
    // Quick Sub-Metrics in Left Column
    const elVolt = document.getElementById('valVoltage');
    const elTemp = document.getElementById('valTemperature');
    const elVib = document.getElementById('valVibration');

    if (elVolt) elVolt.textContent = `${volt.toFixed(1)} V`;
    if (elTemp) elTemp.textContent = `${temp.toFixed(1)} °C`;
    if (elVib) elVib.textContent = `${vib.toFixed(2)} mm/s`;

    // Individual Sensor Card Badges
    const sVolt = document.getElementById('sensorValVolt');
    const sTemp = document.getElementById('sensorValTemp');
    const sVib = document.getElementById('sensorValVib');
    const sCurr = document.getElementById('sensorValCurr');

    if (sVolt) sVolt.textContent = `${volt.toFixed(1)} V`;
    if (sTemp) sTemp.textContent = `${temp.toFixed(1)} °C`;
    if (sVib) sVib.textContent = `${vib.toFixed(2)} mm/s`;
    if (sCurr) sCurr.textContent = `${curr.toFixed(1)} A`;

    // Main Health Badge
    const mainBadge = document.getElementById('mainHealthBadge');
    if (mainBadge) {
      if (mathResult.healthIndex < 65) {
        mainBadge.className = 'px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold animate-pulse';
        mainBadge.textContent = `HI = ${mathResult.healthIndex}% • CRITICAL`;
      } else if (mathResult.healthIndex < 82) {
        mainBadge.className = 'px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold';
        mainBadge.textContent = `HI = ${mathResult.healthIndex}% • WARNING`;
      } else {
        mainBadge.className = 'px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold';
        mainBadge.textContent = `HI = ${mathResult.healthIndex}% • HEALTHY`;
      }
    }

    // Gauge & Formula
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

  updateCharts() {
    // 1. Update Main Health Chart
    if (this.charts.health) {
      const ds = this.charts.health.data.datasets[0];
      ds.data = this.telemetryHistory.health;
      this.charts.health.data.labels = this.telemetryHistory.labels;

      const lastHI = this.telemetryHistory.health[this.telemetryHistory.health.length - 1];
      if (lastHI < 65) {
        ds.borderColor = '#ef4444';
        ds.pointBackgroundColor = '#f87171';
      } else if (lastHI < 82) {
        ds.borderColor = '#f59e0b';
        ds.pointBackgroundColor = '#fbbf24';
      } else {
        ds.borderColor = '#00ff9d';
        ds.pointBackgroundColor = '#00ff9d';
      }

      this.charts.health.update('none');
    }

    // 2. Update Sensor Charts
    if (this.charts.voltage) {
      this.charts.voltage.data.labels = this.telemetryHistory.labels;
      this.charts.voltage.data.datasets[0].data = this.telemetryHistory.voltage;
      this.charts.voltage.update('none');
    }

    if (this.charts.temperature) {
      this.charts.temperature.data.labels = this.telemetryHistory.labels;
      this.charts.temperature.data.datasets[0].data = this.telemetryHistory.temperature;
      this.charts.temperature.update('none');
    }

    if (this.charts.vibration) {
      this.charts.vibration.data.labels = this.telemetryHistory.labels;
      this.charts.vibration.data.datasets[0].data = this.telemetryHistory.vibration;
      this.charts.vibration.update('none');
    }

    if (this.charts.current) {
      this.charts.current.data.labels = this.telemetryHistory.labels;
      this.charts.current.data.datasets[0].data = this.telemetryHistory.current;
      this.charts.current.update('none');
    }
  }

  resizeAllCharts() {
    Object.values(this.charts).forEach(c => {
      if (c && typeof c.resize === 'function') c.resize();
    });
  }

  get chart() {
    return this.charts.health;
  }

  // ==================== 7. EVENT LISTENERS ====================
  setupEventListeners() {
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
      this.injectAlert('⚠ CRITICAL: Severe thermal/vibration overload & energy theft detected on TR-DEL-4092', 'rose');
    } else {
      if (badge) {
        badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Energy Balance Normal`;
      }
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-bolt-lightning"></i> Simulate Grid Anomaly / Theft`;
        btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all';
      }
      this.injectAlert('✓ Grid parameters normalized — Smart Intelligence Engine restored baseline balance', 'emerald');
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
}

document.addEventListener('DOMContentLoaded', () => {
  window.vyraDashboard = new VyraDashboard();
});

