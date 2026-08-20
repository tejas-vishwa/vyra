/* VYRA - Smart Grid Command Center Dashboard Simulation */
class VyraDashboard {
  constructor() {
    this.chart = null;
    this.activeMetric = 'voltage';
    this.isAnomalyActive = false;
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
  }

  initChart() {
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;

    // Generate initial 12 data points
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
    // Tab switching for metrics
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

    // Anomaly simulation toggle button
    const anomalyBtn = document.getElementById('toggleAnomalyBtn');
    if (anomalyBtn) {
      anomalyBtn.addEventListener('click', () => {
        this.isAnomalyActive = !this.isAnomalyActive;
        this.toggleAnomalyState();
      });
    }
  }

  updateChartDataset() {
    if (!this.chart) return;

    let label = 'Voltage (V)';
    let color = '#10b981';
    let bgColor = 'rgba(16, 185, 129, 0.12)';
    let data = this.telemetryHistory.voltage;

    if (this.activeMetric === 'temperature') {
      label = 'Temperature (°C)';
      color = '#f59e0b';
      bgColor = 'rgba(245, 158, 11, 0.12)';
      data = this.telemetryHistory.temperature;
    } else if (this.activeMetric === 'vibration') {
      label = 'Vibration (mm/s)';
      color = '#3b82f6';
      bgColor = 'rgba(59, 130, 246, 0.12)';
      data = this.telemetryHistory.vibration;
    } else if (this.activeMetric === 'current') {
      label = 'Current (A)';
      color = '#06b6d4';
      bgColor = 'rgba(6, 182, 212, 0.12)';
      data = this.telemetryHistory.current;
    }

    this.chart.data.datasets[0].label = label;
    this.chart.data.datasets[0].borderColor = color;
    this.chart.data.datasets[0].backgroundColor = bgColor;
    this.chart.data.datasets[0].pointBackgroundColor = color;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  startLiveStream() {
    setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Generate new bounded values
      const lastVolt = this.telemetryHistory.voltage[this.telemetryHistory.voltage.length - 1];
      const lastTemp = this.telemetryHistory.temperature[this.telemetryHistory.temperature.length - 1];
      const lastVib = this.telemetryHistory.vibration[this.telemetryHistory.vibration.length - 1];
      const lastCurr = this.telemetryHistory.current[this.telemetryHistory.current.length - 1];

      let nextVolt = lastVolt + (Math.random() - 0.5) * 1.5;
      let nextTemp = lastTemp + (Math.random() - 0.48) * 0.4;
      let nextVib = lastVib + (Math.random() - 0.5) * 0.1;
      let nextCurr = lastCurr + (Math.random() - 0.5) * 2;

      // Inject anomaly spike if active
      if (this.isAnomalyActive) {
        nextTemp += 2.5;
        nextVib += 0.8;
        nextCurr += 12;
      }

      // Bound checks
      nextVolt = Math.max(220, Math.min(250, nextVolt));
      nextTemp = Math.max(35, Math.min(85, nextTemp));
      nextVib = Math.max(0.5, Math.min(5.0, nextVib));
      nextCurr = Math.max(100, Math.min(200, nextCurr));

      // Push to history
      this.telemetryHistory.labels.push(timeStr);
      this.telemetryHistory.voltage.push(nextVolt);
      this.telemetryHistory.temperature.push(nextTemp);
      this.telemetryHistory.vibration.push(nextVib);
      this.telemetryHistory.current.push(nextCurr);

      // Keep max size
      if (this.telemetryHistory.labels.length > this.maxDataPoints) {
        this.telemetryHistory.labels.shift();
        this.telemetryHistory.voltage.shift();
        this.telemetryHistory.temperature.shift();
        this.telemetryHistory.vibration.shift();
        this.telemetryHistory.current.shift();
      }

      // Update UI displays
      this.updateTelemetryValues(nextVolt, nextTemp, nextVib, nextCurr);
      if (this.chart) this.chart.update('none');
    }, 2000);
  }

  updateTelemetryValues(volt, temp, vib, curr) {
    const elVolt = document.getElementById('valVoltage');
    const elTemp = document.getElementById('valTemperature');
    const elVib = document.getElementById('valVibration');
    const elCurr = document.getElementById('valCurrent');

    if (elVolt) elVolt.textContent = `${volt.toFixed(1)} V`;
    if (elTemp) elTemp.textContent = `${temp.toFixed(1)} °C`;
    if (elVib) elVib.textContent = `${vib.toFixed(2)} mm/s`;
    if (elCurr) elCurr.textContent = `${curr.toFixed(1)} A`;
  }

  toggleAnomalyState() {
    const badge = document.getElementById('theftAnomalyBadge');
    const statusText = document.getElementById('transformerStatusText');
    const rulCircle = document.getElementById('rulCircleVal');
    const rulText = document.getElementById('rulPercentageText');
    const btn = document.getElementById('toggleAnomalyBtn');

    if (this.isAnomalyActive) {
      if (badge) {
        badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-2';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> ⚠ ANOMALY DETECTED: Theft / Imbalance Risk`;
      }
      if (statusText) {
        statusText.textContent = 'CRITICAL WARNING';
        statusText.className = 'text-xs font-semibold uppercase tracking-wider text-rose-400';
      }
      if (rulCircle) {
        rulCircle.style.strokeDashoffset = '120'; // Drops RUL visually
      }
      if (rulText) rulText.textContent = '58%';
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Reset Grid Simulation`;
        btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all';
      }

      // Add emergency item to alert feed
      this.injectAlert('⚠ CRITICAL: Energy imbalance detected in Zone 7 (High Theft Risk Flagged)', 'rose');
    } else {
      if (badge) {
        badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2';
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Energy Balance Normal`;
      }
      if (statusText) {
        statusText.textContent = 'HEALTHY';
        statusText.className = 'text-xs font-semibold uppercase tracking-wider text-emerald-400';
      }
      if (rulCircle) {
        rulCircle.style.strokeDashoffset = '36'; // ~87%
      }
      if (rulText) rulText.textContent = '87%';
      if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-bolt-lightning"></i> Simulate Grid Anomaly / Theft`;
        btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all';
      }

      this.injectAlert('✓ Grid parameters normalized — AI Engine re-established baseline balance', 'emerald');
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
