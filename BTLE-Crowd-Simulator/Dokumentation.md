# BTLE-Crowd-Simulator - Dokumentation

## 1. Projektueberblick

Der **BTLE-Crowd-Simulator** ist eine C++17-Anwendung, die realistische
Personenstroeme ueber ein gerichtetes Sensor-Netz simuliert und die
resultierenden "detected device"-Zaehlungen pro Sensor und Zeitintervall
per HTTP POST an ein Backend meldet.

### Ziel

> **Erzeugung realistischer BTLE-Telemetrie fuer Backend- und Crowd-
> Management-Tests** - ohne dass reale ESP32-Scanner und reale Menschen
> erforderlich sind.

### Kompatibilitaet zum realen Scanner

Der Simulator sendet das **identische JSON-Telegramm** wie der reale
ESP32/Raspberry-BTLE-Scanner (`senderType`, `deviceCount`, `lat`, `long`,
`measureTime`). Das Backend kann simulierte und reale Sensoren nicht
unterscheiden - was genau das gewuenschte Verhalten fuer Lasttests und
End-to-End-Validierung ist.

---

## 2. Architektur

```
main.cpp          Einstieg, Signal-Handling (SIGINT/SIGTERM)
config.cpp/h      JSON-Parser (nlohmann/json) -> SimulationConfig
simulator.cpp/h   Tick-Loop, Rollenlogik, Transit-Warteschlangen
http_client.cpp/h libcurl-Wrapper, asynchroner POST via std::thread::detach
types.h           Datenstrukturen (Sensor, RoleConfig, TimelinePhase)
```

### Abhaengigkeiten

| Komponente        | Paket (Debian/Raspberry Pi OS)    |
|-------------------|-----------------------------------|
| C++17-Compiler    | `build-essential`                 |
| HTTP-Client       | `libcurl4-openssl-dev`            |
| JSON-Parser       | `nlohmann-json3-dev`              |
| Threading         | pthread (Teil von glibc)          |

---

## 3. Simulationsmodell

### 3.1. Diskrete Zeit (Ticks)

Die Simulation arbeitet in festen Zeitschritten (`interval_sec`, Standard
5 s). In jedem Tick wird fuer **alle** Sensoren:

1. Ankommende Einheiten aus der Transit-Warteschlange uebernommen
2. Rollenverhalten (SOURCE / TRANSIT / SINK) angewandt
3. Ein JSON-Telegramm an das Backend gesendet

### 3.2. Rollen

| Rolle     | Wirkung pro Tick                                                                 |
|-----------|----------------------------------------------------------------------------------|
| `SOURCE`  | `auto_growth` neue Einheiten + `flow_rate x current_count` an `targets` |
| `TRANSIT` | `flow_rate x current_count` weiter an `targets` (Durchgangspunkt) |
| `SINK`    | `flow_rate x current_count` wird entfernt (Austritt aus Erfassungsbereich) |

Jeder Sensor definiert **zwei** Rollen: eine fuer `forward`, eine fuer
`backward`. Welche aktiv ist, steuert die `timeline`.

### 3.3. Transit-Warteschlange

Verlaesst eine Einheit Sensor A in Richtung B, verschwindet sie aus A
**sofort** und erscheint nach `travel_time_sec` in B. Die Zwischenzeit
verbringt sie in B's `incoming`-Queue (std::deque) - ohne dass sie an
irgendeinem Sensor sichtbar ist.

### 3.4. Timeline / FSM

```json
"timeline": [
  { "mode": "forward",  "duration_ticks": 120, "label": "Einlass" },
  { "mode": "backward", "duration_ticks": 120, "label": "Auslass" }
]
```

Die Phasen werden **sequentiell** abgearbeitet. Nach der letzten Phase
terminiert der Simulator.

### 3.5. Steady-State

Ein SOURCE-Sensor pendelt sich auf folgende Population ein:

```
population_steady = auto_growth / flow_rate
```

Begrenzt durch `max_capacity`. Das ist der wichtigste Hebel zum Tuning:
**Zielhoehe erhoehen** -> `auto_growth` rauf **oder** `flow_rate` runter.

---

## 4. JSON-Telegramm

Pro Tick sendet jeder Sensor folgendes JSON per HTTP POST:

```json
{
  "lat": 52.520100,
  "long": 13.405000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-18T14:30:00Z"
}
```

### Felder

| Feld          | Typ    | Beschreibung |
|---------------|--------|--------------|
| `lat`         | double | Breitengrad des Sensors (aus `config.json`) |
| `long`        | double | Laengengrad des Sensors (aus `config.json`) |
| `senderType`  | string | Fester Wert `"BTLE"` |
| `deviceCount` | int    | Aktuell simulierte Geraete im Erfassungsbereich |
| `measureTime` | string | ISO 8601 UTC-Zeitstempel (`YYYY-MM-DDTHH:MM:SSZ`) |

### Sensor-Identifikation

Das Telegramm enthaelt **keine** `sensor_id` - analog zum realen Scanner.
Die Zuordnung erfolgt ueber die URL:

```json
"target_backend_url_template": "https://api.dein-system.de/v1/sensors/{sensor_id}"
```

Der Platzhalter `{sensor_id}` wird pro Sensor ersetzt.

---

## 5. Konfigurationsreferenz

### 5.1. Grundstruktur

```json
{
  "simulation_control": { ... },
  "sensors": [ { ... }, { ... } ]
}
```

### 5.2. `simulation_control`

| Feld                           | Typ    | Wirkung |
|--------------------------------|--------|---------|
| `interval_sec`                 | int    | Dauer eines Ticks. Beeinflusst Backend-Last und Transit-Aufloesung |
| `target_backend_url_template`  | string | URL mit `{sensor_id}`-Platzhalter |
| `timeline`                     | array  | Phasen in Reihenfolge |

**Timeline-Eintrag:**

| Feld              | Typ    | Wirkung |
|-------------------|--------|---------|
| `mode`            | string | `"forward"` oder `"backward"` |
| `duration_ticks`  | int    | Phasenlaenge. Reale Dauer = `duration_ticks x interval_sec` |
| `label`           | string | Nur fuer Logausgabe |

### 5.3. `sensors[]` - Statische Felder

| Feld           | Typ    | Wirkung |
|----------------|--------|---------|
| `id`           | string | Eindeutige ID fuer URL und `targets`-Referenzen |
| `lat`, `lon`   | double | WGS84-Koordinaten, nur fuer Telegramm |
| `max_capacity` | int    | **Harte Kappung** von `deviceCount` |

### 5.4. `sensors[].forward` / `sensors[].backward`

| Feld               | Typ    | Wirkung |
|--------------------|--------|---------|
| `role`             | string | `SOURCE` \| `TRANSIT` \| `SINK` |
| `targets`          | array  | IDs der Nachfolger-Sensoren (bei mehreren: gleichmaessige Aufteilung) |
| `travel_time_sec`  | int    | Verzoegerung zwischen Verlassen hier und Ankunft beim Target |
| `flow_rate`        | double | `[0.0 .. 1.0]` - Anteil der Population pro Tick |
| `auto_growth`      | int    | Neue Einheiten pro Tick (nur SOURCE relevant) |

Weitere Details und Wechselwirkungen: siehe **`CONFIG.md`** im selben Ordner.

---

## 6. Tuning-Kochbuch

### 6.1. Hoehere Zielpopulation

```
population_steady = auto_growth / flow_rate
```

| Ziel  | `auto_growth` | `flow_rate` | `max_capacity` min. |
|-------|---------------|-------------|---------------------|
| 500   | 100           | 0.20        | 800                 |
| 1000  | 200           | 0.20        | 1500                |
| 2000  | 200           | 0.10        | 3000                |
| 5000  | 250           | 0.05        | 7000                |

### 6.2. Schnellerer Aufwuchs

Groessere `auto_growth` -> Population waechst pro Tick schneller. Achtung:
`max_capacity` muss ausreichend hoch sein, sonst wird der Zuwachs gekappt.

### 6.3. Langsameres Abklingen (SINK)

Niedrigere `flow_rate` verlaengert die Verweildauer. Halbwertszeit:

```
t_half = ln(2) / ln(1 / (1 - flow_rate))   [in Ticks]
```

| `flow_rate` | Halbwertszeit |
|-------------|---------------|
| 0.05        | ~13.5 Ticks   |
| 0.10        | ~6.6 Ticks    |
| 0.30        | ~1.9 Ticks    |
| 0.50        | 1 Tick        |

### 6.4. Zwei Wege zu einem Ziel, Rueckweg ueber beide

Forward: `SNSR-A` und `SNSR-B` beide mit `targets: ["SNSR-MERGE"]`.
Backward: `SNSR-MERGE` mit `targets: ["SNSR-A", "SNSR-B"]` -
Outflow wird **50:50** aufgeteilt.

---

## 7. Build & Installation

### 7.1. Abhaengigkeiten installieren (Debian/Raspberry Pi OS)

```bash
sudo apt install build-essential libcurl4-openssl-dev nlohmann-json3-dev
```

### 7.2. Kompilieren

```bash
make
```

Erzeugt das Binary `btle_crowd_simulator` im Projektordner.

### 7.3. Lokal ausfuehren

```bash
./btle_crowd_simulator config.json
```

### 7.4. Systemweit installieren (mit systemd-Service)

```bash
sudo make install
sudo systemctl daemon-reload
sudo systemctl enable --now btle-crowd-simulator
```

- Binary: `/usr/local/bin/btle_crowd_simulator`
- Config: `/etc/btle-crowd-simulator/config.json` (wird bei Re-Install nicht ueberschrieben)
- Unit:   `/etc/systemd/system/btle-crowd-simulator.service`

### 7.5. Deinstallation

```bash
sudo make uninstall
```

Config unter `/etc/btle-crowd-simulator` bleibt erhalten und muss bei
Bedarf manuell entfernt werden.

---

## 8. systemd-Service

Die Unit `btle-crowd-simulator.service` laeuft unter `nobody:nogroup`
mit umfangreichem Sandboxing:

- `ProtectSystem=strict` - kein Schreibzugriff auf System-Pfade
- `PrivateTmp=true`, `PrivateDevices=true`
- `RestrictAddressFamilies=AF_INET AF_INET6` - nur IP-Sockets
- `MemoryDenyWriteExecute=true` - kein dynamischer Code
- `NoNewPrivileges=true`

Neustart bei Crash nach 5 s (`Restart=on-failure`, `RestartSec=5`).

### Statuspruefung

```bash
sudo systemctl status btle-crowd-simulator
sudo journalctl -u btle-crowd-simulator -f
```

---

## 9. Verhalten im Betrieb

### 9.1. Konsolen-Log (stdout)

Pro Tick eine Zeile je Sensor:

```
[SIM] Phase: Morgendlicher Einlass (mode=forward, ticks=120)
[TICK 0] SNSR-01-PARKING          count=10    -> https://api.dein-system.de/v1/sensors/SNSR-01-PARKING
[TICK 0] SNSR-02-CORRIDOR         count=0     -> https://api.dein-system.de/v1/sensors/SNSR-02-CORRIDOR
...
```

### 9.2. Fehlerbehandlung

- HTTP-Fehler werden auf `stderr` geloggt (`[HTTP] <url> -> <libcurl-msg>`)
  und brechen die Simulation **nicht** ab.
- Config-Fehler beim Start -> Exit-Code `1`.
- Laufzeitfehler -> Exit-Code `2`.
- `SIGINT` / `SIGTERM` -> sauberer Stopp zwischen Ticks, Exit `0`.

### 9.3. Nebenlaeufigkeit

HTTP-POSTs laufen auf detached `std::thread`s. Bei sehr vielen Sensoren
(>100) und niedrigem `interval_sec` kann die Thread-Anzahl kurzzeitig
ansteigen. Bei Bedarf spaeter auf eine Thread-Pool-Loesung umstellen.

---

## 10. Wissenschaftliche Grundlagen

Die Simulation basiert auf etablierten Modellen aus Verkehrsforschung und
Funktechnik. Weiterfuehrende Literatur:

### 10.1. Personenfluss (Pedestrian Dynamics)

- **Helbing, D. & Molnar, P. (1995):** *Social force model for pedestrian
  dynamics.* Physical Review E.
- **Seyfried, A. et al. (2005):** *Fundamental diagram of pedestrian
  movement.* Journal of Statistical Mechanics.

### 10.2. Bluetooth Low Energy (Sensing)

- **Faragher, R. & Harle, R. (2014):** *An Analysis of the Accuracy of
  Bluetooth Low Energy for Indoor Positioning Applications.* ION GNSS+.
- **Gomez, C. et al. (2012):** *Overview and Evaluation of Bluetooth Low
  Energy: An Emerging Low-Power Wireless Technology.* Sensors.

### 10.3. Warteschlangentheorie (Queueing Theory)

- **Kendall, D. G. (1953):** *Stochastic Processes Occurring in the Theory
  of Queues and their Analysis by the Method of the Imbedded Markov Chain.*
  Annals of Mathematical Statistics.

Details und Bezug zu den Parametern: siehe `Technisches_Konzept_Simulator.md`.

---

## 11. Roadmap / Offene Punkte

- [ ] Gewichtete Target-Aufteilung (aktuell gleichmaessig)
- [ ] Optionaler Jitter / RSSI-Rauschen fuer realistischere `deviceCount`-Varianz
- [ ] Metrics-Endpoint (Prometheus) fuer Live-Beobachtung der Populationen
- [ ] Persistente Transit-Queue fuer saubere Fortsetzung nach Neustart
- [ ] Config-Hot-Reload via `SIGHUP`
