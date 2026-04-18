# Crowd Control – Overview

This repository contains three interconnected sub-projects for capturing and visualising crowd densities using Bluetooth Low Energy (BTLE).

---

## Sub-projects

### 1. [CrowdSensing](./CrowdSensing/)

Web-based system for processing and displaying sensor data.

- **Backend** – ASP.NET Core Web API (C#), receives JSON telegrams from sensors and stores them in a SQL database
- **Frontend** – React/TypeScript SPA (Vite), displays an interactive map with heatmap and device counts per sensor in real time

### 2. [BTLE-Scanner](./BTLE-Scanner/)

C++ program for the **Raspberry Pi 5** (Debian/Linux) that actively scans for BTLE devices in the vicinity.

- Uses the Pi's integrated Bluetooth via **BlueZ HCI**
- Sends the number of unique devices per measurement cycle via **HTTP POST** as JSON to the CrowdSensing backend
- Can be operated as a **systemd service**

### 3. [BTLE-Simulator](./BTLE-Simulator/)

C++ program that simulates a real sensor network to allow backend testing without hardware.

- Models crowd flows through a directed sensor network (`SOURCE → TRANSIT → SINK`)
- Configurable via `config.json` (schedule, capacities, flow rates)
- Sends clock-driven JSON telegrams via **HTTP POST** to the backend

---

## System Interaction

```
[BTLE-Scanner / BTLE-Simulator]
          │  HTTP POST (JSON)
          ▼
   [CrowdSensing Backend]
          │  SQL
          ▼
   [CrowdSensing Frontend]  ←  Browser (Map + Heatmap)
```

---

## JSON Telegram (common format)

All senders (scanner and simulator) use the same format:

```json
{
  "lat": 52.520100,
  "long": 13.405000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-18T14:30:00Z"
}
```

---

## Quick Start

Detailed installation and configuration guides are located in the README files of the respective sub-projects:

- [`CrowdSensing/README.md`](./CrowdSensing/README.md)
- [`BTLE-Scanner/README.md`](./BTLE-Scanner/README.md)
- [`BTLE-Simulator/README.md`](./BTLE-Simulator/README.md)
