# VYRA — AI-Powered Smart Grid Monitoring & Predictive Transformer Health System

> **“Powering India’s Future with Artificial Intelligence”**

---

## About VYRA

VYRA is an AI-powered smart grid monitoring, fault detection, and predictive transformer health system designed specifically to modernize India's electricity distribution infrastructure (DISCOMs).

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
3. **End-to-End System Architecture**: Visual 4-stage pipeline connecting IoT Sensors, Data Transmission, VYRA AI Engine, and Command Center Alerts.
4. **Impact & Metrics**: Projected O&M cost reduction (40%), transformer lifespan extension (2X), and sub-second fault detection.
5. **Traditional vs VYRA Matrix**: Comprehensive glassmorphism comparison table.
6. **Live Interactive Dashboard**: Real-time telemetry line charts (Voltage, Temperature, Vibration, Current), real-time mathematical health formula calculation card, circular RUL indicator, energy balance theft badge, and live event feed.
7. **Interactive Map of India**: Dynamic node network showing smart grid coverage across Delhi, Mumbai, Bengaluru, Varanasi, Kolkata, Chennai, and Hyderabad.
8. **Scalable Future Vision & Tech Stack**: Overview of IoT, Cloud/Edge, Deep Learning, and Mobile Alert integration.

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