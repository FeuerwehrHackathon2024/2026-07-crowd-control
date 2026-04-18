# BTLE-Crowd-Simulator

C++-Implementierung eines BTLE-Crowd-Simulators.
Simuliert Personenströme über ein gerichtetes Sensor-Netz
(SOURCE → TRANSIT → SINK) und sendet pro Tick ein JSON-Telegramm
per HTTP-POST an ein Backend.

## Abhängigkeiten

- C++17 Compiler (`g++` oder `clang++`)
- [libcurl](https://curl.se/libcurl/) (`libcurl4-openssl-dev` auf Debian/Ubuntu)
- [nlohmann/json](https://github.com/nlohmann/json) (`nlohmann-json3-dev` auf Debian/Ubuntu)
- pthreads

### Debian / Ubuntu / Raspberry Pi OS

```bash
sudo apt install build-essential libcurl4-openssl-dev nlohmann-json3-dev
```

### Windows (MSYS2 / MinGW)

```bash
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-curl mingw-w64-x86_64-nlohmann-json make
```

## Build

```bash
make
```

Ausführen:

```bash
./btle_simulator config.json
```

## JSON-Telegramm

Pro Tick sendet jeder Sensor folgendes Paket:

```json
{
  "lat": 52.520100,
  "long": 13.405000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-18T14:30:00Z"
}
```

Die Sensor-Identifikation erfolgt über die Ziel-URL
(`target_backend_url_template` mit Platzhalter `{sensor_id}`).

## Konfiguration (`config.json`)

| Feld                           | Bedeutung |
|--------------------------------|-----------|
| `simulation_control.interval_sec` | Länge eines Ticks in Sekunden |
| `target_backend_url_template` | URL-Schablone, `{sensor_id}` wird pro Sensor ersetzt |
| `timeline[]`                  | Abfolge der Modi (`forward` / `backward`) in Ticks |
| `sensors[].max_capacity`      | Max. simultan erfassbare Geräte |
| `sensors[].forward|backward`  | Rolle & Flussparameter pro Richtung |

### Rollen

| Rolle     | Wirkung pro Tick |
|-----------|------------------|
| `SOURCE`  | `auto_growth` neue Einheiten + `flow_rate` × Population → Targets |
| `TRANSIT` | `flow_rate` × Population → Targets (FIFO-Queue mit `travel_time_sec`) |
| `SINK`    | `flow_rate` × Population entfernt (Austritt aus Erfassungsbereich) |

## Architektur

```
main.cpp          Einstiegspunkt, Signal-Handling
config.cpp/h      JSON-Parser (nlohmann/json) → SimulationConfig
simulator.cpp/h   Tick-Loop, Rollenlogik, Transit-Warteschlangen
http_client.cpp/h libcurl-Wrapper, async POST via detached std::thread
types.h           Datenstrukturen (Sensor, RoleConfig, TimelinePhase …)
```

## Abbruch

`SIGINT` (Ctrl+C) oder `SIGTERM` stoppt die Simulation sauber
zwischen zwei Ticks.
