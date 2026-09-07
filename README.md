# VYRA — Smart Intelligence Smart Grid Monitoring & Predictive Transformer Health System

> **“Powering India’s Future with Smart Intelligence”**

---

## About VYRA

VYRA is a Smart Intelligence smart grid monitoring, fault detection, and predictive transformer health system designed specifically to modernize India's electricity distribution infrastructure (DISCOMs).

### Mathematical Transformer Health Index Formula
VYRA calculates the Transformer Health Index ($\text{HI}$) percentage in real-time from continuous IoT sensor telemetry:

$$\text{HI} = 100 - \left( P_T + P_V + P_{\Delta V} + P_I \right)$$

Where:
- $P_T = \left( \frac{\max(0, T - 50)}{35} \right)^{1.8} \times 45$ (Temperature penalty factor)
- $P_V = \left( \frac{\max(0, V - 1.5)}{3.5} \right)^{1.5} \times 35$ (Vibration penalty factor)
- $P_{\Delta V} = \left( \frac{|V_{\text{volt}} - 240|}{240} \right) \times 100 \times 1.5$ (Voltage deviation penalty)
- $P_I = \left( \frac{\max(0, I - 140)}{60} \right)^{1.5} \times 25$ (Current load penalty)

The output is bounded $\text{HI} \in [5\%, 100\%]$ and continuously feeds into the circular progress gauge, remaining useful life (RUL) estimation, and command center status alerts.

---

## Key Features
1. **Hero Command Center**: Futuristic dark-mode interface with live interactive grid node canvas.
2. **Key Challenges Solved**: Interactive modules for Transformer Failures, High AT&C Transmission Losses, Electricity Theft Detection, and Delayed Fault Detection.
3. **End-to-End System Architecture**: Visual 4-stage pipeline connecting IoT Sensors, Data Transmission, VYRA Smart Intelligence Engine, and Command Center Alerts.
4. **Impact & Metrics**: Projected O&M cost reduction (40%), transformer lifespan extension (2X), and sub-second fault detection.
5. **Traditional vs VYRA Matrix**: Comprehensive glassmorphism comparison table.
6. **Live Interactive Dashboard**: Real-time telemetry line charts (Voltage, Temperature, Vibration, Current), real-time mathematical health formula calculation card, circular RUL indicator, energy balance theft badge, and live event feed.
7. **Interactive Map of India**: Dynamic node network showing smart grid coverage across Delhi, Mumbai, Bengaluru, Varanasi, Kolkata, Chennai, and Hyderabad.
8. **Scalable Future Vision & Tech Stack**: Overview of IoT, Cloud/Edge, Deep Learning, and Mobile Alert integration.

---

## ESP32 IoT Hardware & Sensor Integration

The project now includes ready-to-flash IoT firmware located under [`esp32_firmware/`](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware):

1. **Hardware Supported**:
   - **ESP32 DevKit** (30-pin or 38-pin).
   - **Voltage Sensor**: ZMPT101B (AC Mains) or 0-25V Voltage Divider Module (DC).
   - **Current Sensor**: ACS712 (5A/20A/30A) or SCT-013 Split-Core CT.
   - **Pins**: **GPIO 34** (Voltage ADC1) and **GPIO 35** (Current ADC1) to prevent Wi-Fi channel contention.
2. **Dual Website Outputs**:
   - **Self-Hosted Embedded Dashboard**: Visit `http://<esp32-ip>/` or `http://vyra-esp32.local/` directly from your phone/PC on the same Wi-Fi.
   - **VYRA Command Center Bridge**: Connect via `Connect ESP32 (WiFi)` in the web dashboard to stream live physical voltage, current, and calculate real-time Transformer Health Index ($HI\%$).
3. **Firmware Files**:
   - [`esp32_sensor_monitor.ino`](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware/esp32_sensor_monitor.ino): Main Arduino sketch with True-RMS sampling and REST API.
   - [`config.h`](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware/config.h): Wi-Fi credentials and sensor calibration parameters.
   - [`web_page.h`](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware/web_page.h): Responsive embedded dark-mode dashboard in PROGMEM.
   - [`README.md`](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware/README.md): Pinout diagrams, safety instructions, and step-by-step flashing guide.

---

## Deployment & Local Preview

### Deployment on Vercel
The project includes `vercel.json` and is standard static web content ready to deploy instantly on Vercel:
```bash
# Deploy with Vercel CLI (if installed)
vercel --prod
```
Or import the GitHub repository [`https://github.com/tejas-vishwa/vyra.git`](https://github.com/tejas-vishwa/vyra.git) directly into your Vercel Dashboard.

---

## Brand Guidelines
- **Brand Name**: VYRA
- **Color Palette**: Deep Slate (`#030712`), Neon Green (`#10b981` / `#00ff9d`), Electric Blue (`#3b82f6` / `#00f2fe`), Cyan (`#06b6d4`).