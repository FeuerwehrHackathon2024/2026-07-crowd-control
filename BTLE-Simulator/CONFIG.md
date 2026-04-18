# Configuration Reference: `config.json`

This document describes **every field** of the `config.json` of the BTLE Crowd Simulator
and its effect on simulation behaviour.

---

## 1. Basic Structure

```json
{
  "simulation_control": { ... },
  "sensors": [ { ... }, { ... } ]
}
```

| Block | Purpose |
|-------|-------|
| `simulation_control` | Global timing, backend URL, phase schedule |
| `sensors` | List of all simulated sensors with position, capacity and role behaviour |

---

## 2. `simulation_control`

### 2.1. `interval_sec` (Integer, seconds)

Duration of **one tick**. All flows and telegrams are calculated and sent exactly once per tick.

| Value | Effect |
|------|--------|
| `5` | Realistic default for typical scan cycles |
| `< 5` | Higher temporal resolution, more load on backend |
| `> 5` | Lower resolution, smoother curves, less HTTP traffic |

> **Important:** All `travel_time_sec` values are converted internally to ticks
> (`ceil(travel_time_sec / interval_sec)`, minimum 1 tick). Increasing `interval_sec`
> reduces transit time resolution.

### 2.2. `target_backend_url_template` (String)

URL template that becomes the concrete target URL per sensor by replacing `{sensor_id}`.

```json
"target_backend_url_template": "https://api.your-system.com/v1/sensors/{sensor_id}"
```

| Value | Effect |
|------|--------|
| URL with `{sensor_id}` | Each sensor POSTs to its own URL |
| URL without placeholder | All sensors send to the same URL (backend must identify from other context) |

### 2.3. `timeline[]` (Array of phases)

Sequential execution plan. The simulation passes through the phases **in order** and
terminates afterwards. Each phase specifies which direction (`forward`/`backward`) is
active for all sensors.

```json
"timeline": [
  { "mode": "forward",  "duration_ticks": 120, "label": "Morning Entry" },
  { "mode": "backward", "duration_ticks": 120, "label": "Evening Drain" }
]
```

| Field | Type | Effect |
|-------------------|--------|---------|
| `mode` | String | `"forward"` → `forward` role of each sensor active; `"backward"` → `backward` role |
| `duration_ticks` | Int | Number of ticks this phase runs. Total duration in seconds = `duration_ticks × interval_sec` |
| `label` | String | For logging only, no simulation effect |

**Example calculation:** `duration_ticks: 120` at `interval_sec: 5` → 600 s = 10 min.

---

## 3. `sensors[]`

Each sensor represents a detection point with position and two
behaviour profiles (for `forward` and `backward` phase).

### 3.1. Static Fields

| Field | Type | Effect |
|----------------|--------|---------|
| `id` | String | Unique ID; used in URL (`{sensor_id}`) and `targets` references of other sensors |
| `lat` | Double | Latitude (WGS84) — for JSON telegram only, no flow effect |
| `lon` | Double | Longitude (WGS84) — for JSON telegram only, no flow effect |
| `max_capacity` | Int | **Upper limit** for `deviceCount`. Excess arrivals are discarded |

#### Effect of `max_capacity`

- Acts as a **hard cap**: after each arrival from the transit queue and after `auto_growth`,
  `current_count = min(current_count, max_capacity)`.
- Simulates physical limits (e.g. stadium capacity is 2500 persons).
- **Important:** Too small → units are "lost" (overflow discarded).
  Too large → capacity no longer throttles the flow.

### 3.2. `forward` and `backward` (RoleConfig)

Each sensor has **two** role configurations. The `timeline` decides per
phase which one is active. Both blocks have the same structure:

```json
"forward": {
  "role": "SOURCE",
  "targets": ["SNSR-02-CORRIDOR"],
  "travel_time_sec": 15,
  "flow_rate": 0.20,
  "auto_growth": 10
}
```

#### 3.2.1. `role` (String, required)

Determines the fundamental behaviour of the sensor in the respective phase.

| Role | Executed per tick |
|-----------|---------------------|
| `SOURCE` | Creates `auto_growth` new units → sends `flow_rate × current_count` to `targets` |
| `TRANSIT` | Receives only (from other sensors) → sends `flow_rate × current_count` to `targets` |
| `SINK` | Receives only → removes `flow_rate × current_count` (exit from detection area) |

#### 3.2.2. `targets` (Array of sensor IDs)

The downstream sensors that receive outflow.

| Value | Effect |
|----------------------|--------|
| `[]` (empty) | No outflow (required for `SINK`; harmless but pointless for `SOURCE`/`TRANSIT`) |
| 1 ID | All outflow goes to this sensor |
| Multiple IDs | Outflow is **evenly distributed** (remainder units distributed to first targets) |

> Unknown target IDs are silently ignored.

#### 3.2.3. `travel_time_sec` (Int, seconds)

Delay between leaving **this** sensor and arriving at the target.
Converted internally to ticks (`ceil(travel_time_sec / interval_sec)`, minimum 1).

| Value | Effect |
|------|--------|
| `0` | Arrival in the **next** tick (minimum) |
| `15`, `interval_sec=5` | 3-tick delay |
| Very large | Units "queue up" in the transit queue; target fills with a delay |

**Units in transit are not visible** — neither at the source nor at the target sensor. They only appear in the target's `deviceCount` on arrival.

#### 3.2.4. `flow_rate` (Double, 0.0–1.0)

**Fraction of the current population** that triggers the behaviour per tick:

| Role | Meaning of `flow_rate` |
|-----------|---------------------------|
| `SOURCE` | Departure to `targets` per tick |
| `TRANSIT` | Forwarding to `targets` per tick |
| `SINK` | Removal from detection area per tick |

| Value | Effect |
|----------|--------|
| `0.0` | No flow — population stays constant (or only grows via `auto_growth`) |
| `0.10` | 10 % of population leaves/moves per tick — slow flow |
| `0.50` | Half per tick — rapid flow, strong pulsing |
| `1.0` | Entire population moves every tick — no queuing possible |

> The calculation is `floor(current_count × flow_rate)` — at very small populations (< 10)
> and low rates, flow can round down to 0. → Choose at least `flow_rate ≥ 1/current_count`
> or keep the population high.

#### 3.2.5. `auto_growth` (Int, `SOURCE` only)

Absolute number of new units per tick. Added **before** outflow and then
capped at `max_capacity`.

| Value | Effect |
|------|--------|
| `0` | No new generation (typical for `TRANSIT`/`SINK`) |
| `10` | 10 new devices per tick — moderate inflow rate |
| `25` | High inflow (e.g. large event) |

> **Equilibrium:** In steady state `auto_growth ≈ flow_rate × current_count`,
> the population stabilises at approximately `auto_growth / flow_rate` (before `max_capacity` cap).

---

## 4. Parameter Interactions

### 4.1. Steady State of a SOURCE

A SOURCE sensor reaches an equilibrium population at stable parameters:

```
current_count_stable ≈ auto_growth / flow_rate   (capped by max_capacity)
```

**Example:** `auto_growth=10`, `flow_rate=0.20` → approx. 50 devices in steady state.

### 4.2. Congestion Effect in TRANSIT

If the arrival rate (outflow from all pointing predecessors) is greater than
`flow_rate × max_capacity` of the TRANSIT, congestion builds — until the capacity
hard-caps and further arrivals are discarded.

### 4.3. Drain Balance in SINK

A SINK grows as long as arrivals > `flow_rate × current_count`. At
`flow_rate=0.30` and a constant supply of 20/tick, the SINK population
stabilises at approx. `20 / 0.30 ≈ 67`.

### 4.4. Transit Delay vs. Phase Length

If `travel_time_sec` per hop is high (e.g. 60 s at `interval_sec=5` → 12 ticks)
and `duration_ticks` is short (e.g. 30), the first units may only reach the end of
the chain after the phase ends. → Always plan phases **longer** than the sum of all
transit times along the chain.

---

## 5. Example Scenarios

### 5.1. Gentle Inflow (Office Building, Morning)

```json
"forward": { "role": "SOURCE", "targets": ["..."], "travel_time_sec": 30, "flow_rate": 0.05, "auto_growth": 3 }
```
- Steady state ~60 persons, slow throughput.

### 5.2. Burst Entry (Stadium)

```json
"forward": { "role": "SOURCE", "targets": ["..."], "travel_time_sec": 10, "flow_rate": 0.30, "auto_growth": 50 }
```
- Steady state ~167 persons, high throughput.

### 5.3. Slow Drain (SINK)

```json
"backward": { "role": "SINK", "targets": [], "travel_time_sec": 0, "flow_rate": 0.10, "auto_growth": 0 }
```
- Half-life ≈ 7 ticks (`ln(2)/ln(1/0.9)`).

---

## 6. Validation Checklist

- [ ] Every ID in `targets` exists as a `sensor.id`.
- [ ] `flow_rate` is in the interval `[0.0, 1.0]`.
- [ ] For role `SINK`, `targets: []` (otherwise harmless but misleading).
- [ ] For role `SOURCE`, `auto_growth > 0` (otherwise the source dries up quickly).
- [ ] `max_capacity` > expected peak.
- [ ] `duration_ticks × interval_sec` > sum of all `travel_time_sec` along the longest chain.
