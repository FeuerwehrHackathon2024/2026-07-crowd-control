# BTLE Crowd Simulator

C++ implementation of a BTLE crowd simulator.
Simulates crowd flows through a directed sensor network
(SOURCE → TRANSIT → SINK) and sends a JSON telegram per tick
via HTTP POST to a backend.

## Dependencies

- C++17 compiler (`g++` or `clang++`)
- [libcurl](https://curl.se/libcurl/) (`libcurl4-openssl-dev` on Debian/Ubuntu)
- [nlohmann/json](https://github.com/nlohmann/json) (`nlohmann-json3-dev` on Debian/Ubuntu)
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

Run:

```bash
./btle_simulator config.json
```

## JSON Telegram

Each sensor sends the following packet per tick:

```json
{
  "lat": 52.520100,
  "long": 13.405000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-18T14:30:00Z"
}
```

Sensor identification is done via the target URL
(`target_backend_url_template` with placeholder `{sensor_id}`).

## Configuration (`config.json`)

| Field | Meaning |
|--------------------------------|-----------|
| `simulation_control.interval_sec` | Length of one tick in seconds |
| `target_backend_url_template` | URL template, `{sensor_id}` is replaced per sensor |
| `timeline[]` | Sequence of modes (`forward` / `backward`) in ticks |
| `sensors[].max_capacity` | Max. simultaneously detectable devices |
| `sensors[].forward|backward` | Role & flow parameters per direction |

### Roles

| Role | Effect per tick |
|-----------|------------------|
| `SOURCE` | `auto_growth` new units + `flow_rate` × population → targets |
| `TRANSIT` | `flow_rate` × population → targets (FIFO queue with `travel_time_sec`) |
| `SINK` | `flow_rate` × population removed (exit from detection area) |

## Architecture

```
main.cpp          Entry point, signal handling
config.cpp/h      JSON parser (nlohmann/json) → SimulationConfig
simulator.cpp/h   Tick loop, role logic, transit queues
http_client.cpp/h libcurl wrapper, async POST via detached std::thread
types.h           Data structures (Sensor, RoleConfig, TimelinePhase …)
```

## Stopping

`SIGINT` (Ctrl+C) or `SIGTERM` stops the simulation cleanly between two ticks.
