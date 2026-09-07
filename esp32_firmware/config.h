#ifndef CONFIG_H
#define CONFIG_H

// =============================================================================
// VYRA ESP32 SENSOR MONITOR - HARDWARE & NETWORK CONFIGURATION
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Wi-Fi Configuration
// -----------------------------------------------------------------------------
// Replace with your Wi-Fi network credentials (2.4 GHz only, ESP32 does not support 5 GHz)
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// Static IP configuration (optional: set to false to use DHCP automatic IP)
#define USE_STATIC_IP   false
#define STATIC_IP       192, 168, 1, 150
#define STATIC_GATEWAY  192, 168, 1, 1
#define STATIC_SUBNET   255, 255, 255, 0
#define STATIC_DNS      8, 8, 8, 8

// mDNS Hostname: access via http://vyra-esp32.local or http://esp32-power.local
#define MDNS_HOSTNAME   "vyra-esp32"

// Fallback Access Point (AP) if router Wi-Fi fails to connect
#define AP_SSID         "VYRA_ESP32_AP"
#define AP_PASSWORD     "vyra12345"

// -----------------------------------------------------------------------------
// 2. Hardware Pin Assignments (Must use ADC1 pins: 32, 33, 34, 35, 36, 39)
// Note: ADC2 pins (GPIO 0, 2, 4, 12-15, 25-27) cannot be used while Wi-Fi is active!
// -----------------------------------------------------------------------------
#define PIN_VOLTAGE_SENSOR   34    // ADC1_CH6 (Input-only, ideal for analog sensors)
#define PIN_CURRENT_SENSOR   35    // ADC1_CH7 (Input-only, ideal for analog sensors)
#define PIN_STATUS_LED        2    // Built-in LED on most ESP32 DevKits (GPIO 2)

// -----------------------------------------------------------------------------
// 3. Sensor Operating Mode: AC (Mains/Grid) vs DC (Battery/Solar)
// -----------------------------------------------------------------------------
// Set to true for AC mains (ZMPT101B + ACS712/SCT-013 with True-RMS sampling)
// Set to false for DC circuits (Voltage Divider + ACS712 DC averaging)
#define MODE_AC              true

// AC Grid Frequency (50 Hz for India/UK/EU, 60 Hz for US)
#define AC_GRID_FREQUENCY_HZ 50

// Number of full AC wave cycles to sample for RMS calculation (typically 2 to 5)
#define AC_SAMPLE_CYCLES     3

// Total RMS sample points per measurement pass (e.g. 500-1500 samples over 60ms)
#define RMS_SAMPLE_COUNT     1000

// -----------------------------------------------------------------------------
// 4. ADC & Reference Calibration
// -----------------------------------------------------------------------------
#define ADC_RESOLUTION_BITS  12    // ESP32 ADC: 12-bit (0 to 4095)
#define ADC_MAX_COUNTS       4095.0f
#define ADC_REF_VOLTAGE      3.3f  // ESP32 analog reference voltage in Volts

// -----------------------------------------------------------------------------
// 5. Voltage Sensor Calibration
// -----------------------------------------------------------------------------
// For AC ZMPT101B module:
// Adjust VOLTAGE_CALIBRATION_FACTOR so the measured RMS voltage matches your multimeter
#define VOLTAGE_CALIBRATION_FACTOR   238.5f  // Multiplier for ZMPT101B
#define VOLTAGE_ZERO_OFFSET_COUNTS   1865    // Midpoint ADC counts (~1.5V to 1.65V)

// For DC Voltage Divider module (e.g., 0-25V module with R1=30k, R2=7.5k -> ratio 5.0):
#define DC_VOLTAGE_DIVIDER_RATIO     5.0f

// Noise threshold: voltages below this will be treated as 0.0V (eliminates floating pin noise)
#define VOLTAGE_NOISE_CUTOFF         3.0f    // Volts

// -----------------------------------------------------------------------------
// 6. Current Sensor Calibration (ACS712 or SCT-013)
// -----------------------------------------------------------------------------
// Select your ACS712 sensor rating (mV per Amp):
// ACS712-05B: 185 mV/A (0.185 V/A)
// ACS712-20A: 100 mV/A (0.100 V/A)
// ACS712-30A:  66 mV/A (0.066 V/A)
#define ACS712_SENSITIVITY_V_PER_A   0.066f  // Default for 30A module

// Midpoint offset for ACS712 (nominally Vcc/2 = 1.65V for 3.3V, or ~2.5V with voltage divider)
#define CURRENT_ZERO_OFFSET_COUNTS   2048

// Scaling factor for ACS712 / SCT-013 calibration against multimeter
#define CURRENT_CALIBRATION_FACTOR   1.00f

// Noise threshold: currents below this will be treated as 0.00A
#define CURRENT_NOISE_CUTOFF         0.08f   // Amperes

// -----------------------------------------------------------------------------
// 7. Telemetry & Web Server Timing
// -----------------------------------------------------------------------------
#define TELEMETRY_INTERVAL_MS        1000    // Update rates in milliseconds
#define SERIAL_BAUD_RATE             115200

#endif // CONFIG_H
