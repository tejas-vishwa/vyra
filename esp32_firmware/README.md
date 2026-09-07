# ESP32 IoT Voltage & Current Sensor Web Monitor

This directory contains the production-ready ESP32 firmware for real-time voltage and current monitoring, power calculation, and self-hosted web dashboard delivery over local Wi-Fi.

---

## 1. Hardware Pinout & Wiring Guide

> [!IMPORTANT]
> **ADC Pin Selection Note**:
> ESP32 has two ADC converters: **ADC1** and **ADC2**. When the Wi-Fi radio is active, **ADC2 is used by the Wi-Fi driver and cannot be read reliably**.
> Therefore, this firmware specifically uses **ADC1** input-only pins:
> - **GPIO 34** (ADC1_CH6): Voltage Sensor Analog Output
> - **GPIO 35** (ADC1_CH7): Current Sensor Analog Output

---

### Option A: AC Mains Measurement (ZMPT101B + ACS712 / SCT-013)

```
[AC Mains Line/Neutral]
       │
       ▼
┌──────────────────┐               ┌───────────────────────────────────────┐
│ ZMPT101B Voltage │── OUT ───────>│ GPIO 34 (ADC1_CH6)                    │
│ Sensor Module    │── VCC ───────>│ 5V or 3.3V                            │
│                  │── GND ───────>│ GND                                   │
└──────────────────┘               │                                       │
                                   │           ESP32 DevKit                │
[AC Load In-Series]                │                                       │
       │                           │                                       │
       ▼                           │                                       │
┌──────────────────┐               │                                       │
│ ACS712 Current   │── OUT ───────>│ GPIO 35 (ADC1_CH7) (via div / direct) │
│ Sensor Module    │── VCC ───────>│ 5V                                    │
│                  │── GND ───────>│ GND                                   │
└──────────────────┘               └───────────────────────────────────────┘
```

#### Detailed Pin Connections (AC Setup)
| Sensor Pin | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **ZMPT101B VCC** | `5V` (or `VIN` / `3V3`) | Power supply for sensor op-amp |
| **ZMPT101B GND** | `GND` | Common ground |
| **ZMPT101B OUT** | `GPIO 34` | AC sine wave analog output (centered around ~1.65V) |
| **ACS712 VCC** | `5V` (or `VIN`) | Requires 5V for internal Hall-effect sensor |
| **ACS712 GND** | `GND` | Common ground |
| **ACS712 OUT** | `GPIO 35` | Current analog output (see voltage divider tip below) |

> [!TIP]
> **ACS712 5V to 3.3V Level Protection**:
> Because the ACS712 is powered by 5V, its idle center voltage is $V_{CC}/2 \approx 2.5\text{V}$. When high currents are measured, peaks can reach up to 4.5V.
> To keep the ESP32 input pin completely safe (< 3.3V), place a simple two-resistor voltage divider on the ACS712 `OUT` pin:
> - ACS712 OUT $\rightarrow$ $1\text{k}\Omega$ Resistor $\rightarrow$ **GPIO 35** $\rightarrow$ $2\text{k}\Omega$ Resistor $\rightarrow$ GND (scales 5V down to 3.3V).

---

### Option B: DC Power Measurement (0-25V Divider + ACS712)

| Sensor Pin | ESP32 Pin | Description |
| :--- | :--- | :--- |
| **DC Voltage Divider VCC** | DC Source (+) | Up to 25V DC |
| **DC Voltage Divider GND** | DC Source (-) | Common ground with ESP32 |
| **DC Voltage Divider S** | `GPIO 34` | Stepped down 0-3.3V analog output |
| **ACS712 VCC** | `5V` | Sensor power |
| **ACS712 GND** | `GND` | Common ground |
| **ACS712 OUT** | `GPIO 35` | Current analog signal |

---

## 2. Flashing the Code to ESP32

### Using Arduino IDE
1. Install **Arduino IDE** (version 2.x recommended).
2. Open **File** $\rightarrow$ **Preferences**, and add this URL into *Additional Boards Manager URLs*:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools** $\rightarrow$ **Board** $\rightarrow$ **Boards Manager**, search for `esp32` by Espressif and click **Install**.
4. Open [esp32_sensor_monitor.ino](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware/esp32_sensor_monitor.ino).
5. Open [config.h](file:///C:/Users/dell/.gemini/antigravity/worktrees/vyra/esp32_sensor_web_dashboard/esp32_firmware/config.h) and set your Wi-Fi credentials:
   ```cpp
   #define WIFI_SSID     "Your_WiFi_Name"
   #define WIFI_PASSWORD "Your_WiFi_Password"
   ```
6. Select your board from **Tools** $\rightarrow$ **Board** (e.g. `ESP32 Dev Module`).
7. Select your serial COM port under **Tools** $\rightarrow$ **Port**.
8. Click **Upload**.

---

## 3. Viewing the Output on Your Website

### Method 1: ESP32 Built-in Web Server (No external server needed!)
1. Open the Arduino IDE **Serial Monitor** at **115200 baud** to see the IP address:
   ```
   [WIFI] Connected Successfully!
   [WIFI] IP Address: 192.168.1.150
   [mDNS] Responder started at http://vyra-esp32.local
   [HTTP] Web Server running on port 80
   ```
2. On any smartphone, laptop, or tablet connected to the **same Wi-Fi**, open your web browser and navigate to:
   ```
   http://192.168.1.150/
   ```
   *(Or navigate to `http://vyra-esp32.local` if your OS supports mDNS).*
3. You will immediately see the futuristic VYRA dark-mode dashboard showing:
   - **AC/DC Voltage (V)** in real-time
   - **AC/DC Current (A)** in real-time
   - **Calculated Active Power (W & kW)**
   - **Accumulated Energy Consumption (kWh)**
   - **Live trend waveform canvas**
   - **Wi-Fi signal strength (RSSI) and Uptime**

### Method 2: VYRA Command Center Website Integration
You can also connect the primary VYRA web application directly to your ESP32:
1. Open `index.html` in your browser.
2. In the **Live Hardware Feed** panel, type your ESP32's local IP (e.g. `192.168.1.150`).
3. Click **Connect ESP32**.
4. The main command center will stream your physical sensor readings directly into the real-time line charts, transformer health index formula, and live grid indicators!

---

## 4. Calibration & Tuning

### Calibrating Voltage
1. Connect a multimeter in AC Voltage mode across your power source.
2. Read the multimeter voltage (e.g. 230V).
3. If the web dashboard reads 220V, adjust `VOLTAGE_CALIBRATION_FACTOR` in `config.h`:
   $$\text{New Factor} = \text{Old Factor} \times \left( \frac{\text{Multimeter Reading}}{\text{Dashboard Reading}} \right)$$

### Calibrating Zero Offsets
When no load or sensor input is connected, click the **Zero Calibrate Offsets** button on the web page, or call:
```bash
curl http://<esp32-ip>/api/calibrate
```
The ESP32 will automatically calibrate and store the idle midpoints.
