# Facial Sensor Project

Starter project for an ESP32-CAM based facial presence/detection sensor.

## Hardware
- ESP32-CAM (AI-Thinker module)
- FTDI programmer (for flashing)
- 5V power supply

## Setup
1. Install ESP32 board support in Arduino IDE.
2. Select board: `AI Thinker ESP32-CAM`.
3. Flash `facial_sensor.ino`.
4. Open Serial Monitor at 115200 baud.

## Notes
- Face detection requires the ESP32 `esp_face` library (included with ESP32 Arduino core examples).
- Adjust camera pins if using a different module.