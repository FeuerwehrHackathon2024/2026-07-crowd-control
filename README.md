# Crowd Control – Überblick

Dieses Repository enthält drei miteinander verbundene Teilprojekte zur Erfassung und Visualisierung von Personendichten über Bluetooth Low Energy (BTLE).

---

## Teilprojekte

### 1. [CrowdSensing](./CrowdSensing/)

Webbasiertes System zur Verarbeitung und Darstellung von Sensordaten.

- **Backend** – ASP.NET Core Web API (C#), empfängt JSON-Telegramme von Sensoren und speichert sie in einer SQL-Datenbank
- **Frontend** – React/TypeScript-SPA (Vite), zeigt eine interaktive Karte mit Heatmap und Gerätezahlen pro Sensor in Echtzeit

### 2. [BTLE-Scanner](./BTLE-Scanner/)

C++-Programm für den **Raspberry Pi 5** (Debian/Linux), das aktiv BTLE-Geräte in der Umgebung erfasst.

- Nutzt das integrierte Bluetooth des Pi über **BlueZ HCI**
- Sendet die Anzahl eindeutiger Geräte pro Messzyklus per **HTTP POST** als JSON an das CrowdSensing-Backend
- Betrieb als **systemd-Service** möglich

### 3. [BTLE-Simulator](./BTLE-Simulator/)

C++-Programm, das einen realen Sensor-Verbund simuliert, um das Backend ohne Hardware testen zu können.

- Modelliert Personenströme über ein gerichtetes Sensor-Netz (`SOURCE → TRANSIT → SINK`)
- Konfigurierbar über `config.json` (Zeitplan, Kapazitäten, Flussraten)
- Sendet taktgesteuert JSON-Telegramme per **HTTP POST** an das Backend

---

## Zusammenspiel

```
[BTLE-Scanner / BTLE-Simulator]
          │  HTTP POST (JSON)
          ▼
   [CrowdSensing Backend]
          │  SQL
          ▼
   [CrowdSensing Frontend]  ←  Browser (Karte + Heatmap)
```

---

## JSON-Telegramm (gemeinsames Format)

Alle Sender (Scanner und Simulator) verwenden dasselbe Format:

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

## Schnellstart

Detaillierte Installations- und Konfigurationsanleitungen befinden sich in den README-Dateien der jeweiligen Teilprojekte:

- [`CrowdSensing/README.md`](./CrowdSensing/README.md)
- [`BTLE-Scanner/README.md`](./BTLE-Scanner/README.md)
- [`BTLE-Simulator/README.md`](./BTLE-Simulator/README.md)
