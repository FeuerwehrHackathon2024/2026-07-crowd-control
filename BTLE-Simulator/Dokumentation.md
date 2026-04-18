# BTLE Crowd Simulator - Documentation

## 1. Project Overview

The **BTLE Crowd Simulator** is a C++17 application that simulates realistic
crowd flows through a directed sensor network and reports the resulting
"detected device" counts per sensor and time interval
via HTTP POST to a backend.

### Goal

> **Generate realistic BTLE telemetry for backend and crowd management tests**
> — without requiring real ESP32 scanners or real people.

### JSON Telegram Format

The telegram contains the fields `lat`, `long`, `senderType`, `deviceCount`
and `measureTime`. The backend cannot distinguish simulated from real sensors
based on the telegram — the desired behaviour for load tests and end-to-end validation.

---

## 2. Architecture

```
main.cpp          Entry point, signal handling (SIGINT/SIGTERM)
config.cpp/h      JSON parser (nlohmann/json) -> SimulationConfig
simulator.cpp/h   Tick loop, role logic, transit queues
http_client.cpp/h libcurl wrapper, async POST via std::thread::detach
types.h           Data structures (Sensor, RoleConfig, TimelinePhase)
```

### Dependencies

| Component | Package (Debian/Raspberry Pi OS) |
|-------------------|-----------------------------------|
| C++17 compiler | `build-essential` |
| HTTP client | `libcurl4-openssl-dev` |
| JSON parser | `nlohmann-json3-dev` |
| Threading | pthread (part of glibc) |

---

## 3. Simulation Model

### 3.1. Discrete Time (Ticks)

The simulation operates in fixed time steps (`interval_sec`, default 5 s).
Each tick performs for **all** sensors:

1. Accept incoming units from the transit queue
2. Apply role behaviour (SOURCE / TRANSIT / SINK)
3. Send a JSON telegram to the backend

### 3.2. Roles

| Role | Effect per tick |
|-----------|----------------------------------------------------------------------------------|
| `SOURCE` | `auto_growth` new units + `flow_rate x current_count` to `targets` |
| `TRANSIT` | `flow_rate x current_count` forwarded to `targets` (pass-through) |
| `SINK` | `flow_rate x current_count` removed (exit from detection area) |

Each sensor defines **two** roles: one for `forward`, one for
`backward`. The active one is controlled by the `timeline`.

### 3.3. Transit Queue

When a unit leaves sensor A towards B, it disappears from A
**immediately** and appears in B after `travel_time_sec`. During transit
it resides in B's `incoming` queue (std::deque) — not visible at any sensor.

### 3.4. Timeline / FSM

```json
"timeline": [
  { "mode": "forward",  "duration_ticks": 120, "label": "Entry" },
  { "mode": "backward", "duration_ticks": 120, "label": "Exit"  }
]
```

Phases are processed **sequentially**. The simulator terminates after the last phase.

### 3.5. Steady State

A SOURCE sensor converges to the following population:

```
population_steady = auto_growth / flow_rate
```

Capped by `max_capacity`. This is the key tuning lever:
**increase target level** → raise `auto_growth` **or** lower `flow_rate`.

---

## 4. JSON Telegram

Each sensor sends the following JSON per tick via HTTP POST:

```json
{
  "lat": 52.520100,
  "long": 13.405000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-18T14:30:00Z"
}
```

### Fields

| Field | Type | Description |
|---------------|--------|--------------|
| `lat` | double | Sensor latitude (from `config.json`) |
| `long` | double | Sensor longitude (from `config.json`) |
| `senderType` | string | Fixed value `"BTLE"` |
| `deviceCount` | int | Currently simulated devices in detection area |
| `measureTime` | string | ISO 8601 UTC timestamp (`YYYY-MM-DDTHH:MM:SSZ`) |

### Sensor Identification

The telegram contains **no** `sensor_id` — analogous to the real scanner.
Assignment is done via the URL:

```json
"target_backend_url_template": "https://api.your-system.com/v1/sensors/{sensor_id}"
```

The placeholder `{sensor_id}` is replaced per sensor.

---

## 5. Configuration Reference

### 5.1. Basic Structure

```json
{
  "simulation_control": { ... },
  "sensors": [ { ... }, { ... } ]
}
```

### 5.2. `simulation_control`

| Field | Type | Effect |
|--------------------------------|--------|---------|
| `interval_sec` | int | Duration of one tick. Affects backend load and transit resolution |
| `target_backend_url_template` | string | URL with `{sensor_id}` placeholder |
| `timeline` | array | Phases in order |

**Timeline entry:**

| Field | Type | Effect |
|-------------------|--------|---------|
| `mode` | string | `"forward"` or `"backward"` |
| `duration_ticks` | int | Phase length. Real duration = `duration_ticks x interval_sec` |
| `label` | string | For log output only |

### 5.3. `sensors[]` — Static Fields

| Field | Type | Effect |
|----------------|--------|---------|
| `id` | string | Unique ID for URL and `targets` references |
| `lat`, `lon` | double | WGS84 coordinates, for telegram only |
| `max_capacity` | int | **Hard cap** for `deviceCount` |

### 5.4. `sensors[].forward` / `sensors[].backward`

| Field | Type | Effect |
|--------------------|--------|---------|
| `role` | string | `SOURCE` \| `TRANSIT` \| `SINK` |
| `targets` | array | IDs of downstream sensors (multiple: evenly distributed) |
| `travel_time_sec` | int | Delay between leaving here and arriving at target |
| `flow_rate` | double | `[0.0 .. 1.0]` — fraction of population per tick |
| `auto_growth` | int | New units per tick (relevant for SOURCE only) |

Further details and interactions: see **`CONFIG.md`**.

---

## 6. Tuning Cookbook

### 6.1. Higher Target Population

```
population_steady = auto_growth / flow_rate
```

| Goal | `auto_growth` | `flow_rate` | `max_capacity` min. |
|-------|---------------|-------------|---------------------|
| 500 | 100 | 0.20 | 800 |
| 1000 | 200 | 0.20 | 1500 |
| 2000 | 200 | 0.10 | 3000 |
| 5000 | 250 | 0.05 | 7000 |

### 6.2. Faster Growth

Larger `auto_growth` → population grows faster per tick. Note:
`max_capacity` must be sufficiently high, otherwise growth is capped.

### 6.3. Slower Drain (SINK)

Lower `flow_rate` extends the dwell time. Half-life:

```
t_half = ln(2) / ln(1 / (1 - flow_rate))   [in ticks]
```

| `flow_rate` | Half-life |
|-------------|---------------|
| 0.05 | ~13.5 ticks |
| 0.10 | ~6.6 ticks |
| 0.30 | ~1.9 ticks |
| 0.50 | 1 tick |

### 6.4. Two Paths to One Target, Return via Both

Forward: `SNSR-A` and `SNSR-B` both with `targets: ["SNSR-MERGE"]`.
Backward: `SNSR-MERGE` with `targets: ["SNSR-A", "SNSR-B"]` —
outflow is split **50:50**.

---

## 7. Build & Installation

### 7.1. Install Dependencies (Debian/Raspberry Pi OS)

```bash
sudo apt install build-essential libcurl4-openssl-dev nlohmann-json3-dev
```

### 7.2. Compile

```bash
make
```

Creates the binary `btle_simulator` in the project folder.

### 7.3. Run Locally

```bash
./btle_simulator config.json
```

### 7.4. System-wide Installation (with systemd Service)

```bash
sudo make install
sudo systemctl daemon-reload
sudo systemctl enable --now btle-simulator
```

- Binary: `/usr/local/bin/btle_simulator`
- Config: `/etc/btle-simulator/config.json` (not overwritten on re-install)
- Unit: `/etc/systemd/system/btle-simulator.service`

### 7.5. Uninstall

```bash
sudo make uninstall
```

The config under `/etc/btle-simulator` is retained and must be removed manually if needed.

---

## 8. systemd Service

The unit `btle-simulator.service` runs under `nobody:nogroup`
with extensive sandboxing:

- `ProtectSystem=strict` — no write access to system paths
- `PrivateTmp=true`, `PrivateDevices=true`
- `RestrictAddressFamilies=AF_INET AF_INET6` — IP sockets only
- `MemoryDenyWriteExecute=true` — no dynamic code
- `NoNewPrivileges=true`

Restart on crash after 5 s (`Restart=on-failure`, `RestartSec=5`).

### Status Check

```bash
sudo systemctl status btle-simulator
sudo journalctl -u btle-simulator -f
```

---

## 9. Runtime Behaviour

### 9.1. Console Log (stdout)

One line per sensor per tick:

```
[SIM] Phase: Morning Entry (mode=forward, ticks=120)
[TICK 0] SNSR-01-PARKING          count=10    -> https://api.your-system.com/v1/sensors/SNSR-01-PARKING
[TICK 0] SNSR-02-CORRIDOR         count=0     -> https://api.your-system.com/v1/sensors/SNSR-02-CORRIDOR
...
```

### 9.2. Error Handling

- HTTP errors are logged to `stderr` (`[HTTP] <url> -> <libcurl-msg>`)
  and do **not** abort the simulation.
- Config errors at startup → exit code `1`.
- Runtime errors → exit code `2`.
- `SIGINT` / `SIGTERM` → clean stop between ticks, exit `0`.

### 9.3. Concurrency

HTTP POSTs run on detached `std::thread`s. With very many sensors
(>100) and low `interval_sec` the thread count may briefly spike.
Switch to a thread-pool solution later if needed.

---

## 10. Scientific Background

The simulation is based on established models from traffic research and
radio engineering. Further reading:

### 10.1. Pedestrian Dynamics

- **Helbing, D. & Molnar, P. (1995):** *Social force model for pedestrian
  dynamics.* Physical Review E.
- **Seyfried, A. et al. (2005):** *Fundamental diagram of pedestrian
  movement.* Journal of Statistical Mechanics.

### 10.2. Bluetooth Low Energy (Sensing)

- **Faragher, R. & Harle, R. (2014):** *An Analysis of the Accuracy of
  Bluetooth Low Energy for Indoor Positioning Applications.* ION GNSS+.
- **Gomez, C. et al. (2012):** *Overview and Evaluation of Bluetooth Low
  Energy: An Emerging Low-Power Wireless Technology.* Sensors.

### 10.3. Queueing Theory

- **Kendall, D. G. (1953):** *Stochastic Processes Occurring in the Theory
  of Queues and their Analysis by the Method of the Imbedded Markov Chain.*
  Annals of Mathematical Statistics.

---

## 11. Roadmap / Open Items

- [ ] Weighted target distribution (currently even split)
- [ ] Optional jitter / RSSI noise for more realistic `deviceCount` variance
- [ ] Metrics endpoint (Prometheus) for live population monitoring
- [ ] Persistent transit queue for clean continuation after restart
- [ ] Config hot-reload via `SIGHUP`
