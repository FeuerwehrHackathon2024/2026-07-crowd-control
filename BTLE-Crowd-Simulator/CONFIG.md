# Konfigurationsreferenz: `config.json`

Dieses Dokument beschreibt **jedes Feld** der `config.json` des BTLE-Crowd-Simulators
und dessen Wirkung auf das Simulationsverhalten.

---

## 1. Grundstruktur

```json
{
  "simulation_control": { ... },
  "sensors": [ { ... }, { ... } ]
}
```

| Block | Zweck |
|-------|-------|
| `simulation_control` | Globale Zeitsteuerung, Backend-URL, Phasenplan |
| `sensors`            | Liste aller simulierten Sensoren mit Position, Kapazität und Rollenverhalten |

---

## 2. `simulation_control`

### 2.1. `interval_sec` (Integer, Sekunden)

Dauer **eines Ticks**. Alle Flüsse und Telegramme werden genau einmal pro Tick berechnet und gesendet.

| Wert | Effekt |
|------|--------|
| `5`  | Entspricht dem ESP32-Scanner — realistischer Standard |
| `< 5` | Höhere zeitliche Auflösung, mehr Last auf Backend |
| `> 5` | Geringere Auflösung, glattere Kurven, weniger HTTP-Traffic |

> **Wichtig:** Alle `travel_time_sec`-Werte werden intern in Ticks umgerechnet
> (`ceil(travel_time_sec / interval_sec)`, mind. 1 Tick). Wer `interval_sec`
> erhöht, verliert Auflösung in Transitzeiten.

### 2.2. `target_backend_url_template` (String)

URL-Schablone, die pro Sensor durch Ersetzen von `{sensor_id}` zur konkreten
Ziel-URL wird.

```json
"target_backend_url_template": "https://api.dein-system.de/v1/sensors/{sensor_id}"
```

| Wert | Effekt |
|------|--------|
| URL mit `{sensor_id}` | Jeder Sensor POSTed an eigene URL |
| URL ohne Platzhalter  | Alle Sensoren senden an dieselbe URL (Backend muss aus anderem Kontext zuordnen) |

### 2.3. `timeline[]` (Array von Phasen)

Sequentieller Ablaufplan. Die Simulation durchläuft die Phasen **in Reihenfolge** und
terminiert danach. Jede Phase legt fest, welche Richtung (`forward`/`backward`) für
alle Sensoren aktiv ist.

```json
"timeline": [
  { "mode": "forward",  "duration_ticks": 120, "label": "Morgendlicher Einlass" },
  { "mode": "backward", "duration_ticks": 120, "label": "Abendlicher Abfluss"   }
]
```

| Feld              | Typ    | Wirkung |
|-------------------|--------|---------|
| `mode`            | String | `"forward"` → `forward`-Rolle jedes Sensors aktiv; `"backward"` → `backward`-Rolle |
| `duration_ticks`  | Int    | Anzahl Ticks, die diese Phase läuft. Gesamtdauer in Sekunden = `duration_ticks × interval_sec` |
| `label`           | String | Nur für Logging, keine Simulationswirkung |

**Beispielrechnung:** `duration_ticks: 120` bei `interval_sec: 5` → 600 s = 10 Min.

---

## 3. `sensors[]`

Jeder Sensor repräsentiert einen Erfassungspunkt mit Position und zwei
Verhaltensprofilen (für `forward`- und `backward`-Phase).

### 3.1. Statische Felder

| Feld           | Typ    | Wirkung |
|----------------|--------|---------|
| `id`           | String | Eindeutige ID; wird in URL (`{sensor_id}`) und `targets`-Referenzen anderer Sensoren verwendet |
| `lat`          | Double | Breitengrad (WGS84) — nur fürs JSON-Telegramm, keine Flusswirkung |
| `lon`          | Double | Längengrad (WGS84) — nur fürs JSON-Telegramm, keine Flusswirkung |
| `max_capacity` | Int    | **Obergrenze** für `deviceCount`. Überschüssige Ankünfte werden abgeschnitten |

#### Einfluss von `max_capacity`

- Wirkt als **harte Kappung**: nach jedem Ankommen aus der Transit-Queue und nach `auto_growth`
  wird `current_count = min(current_count, max_capacity)`.
- Simuliert physikalische Limits (z. B. Stadion fasst 2500 Personen).
- **Wichtig:** Zu klein gewählt → Einheiten gehen "verloren" (Überlauf wird verworfen).
  Zu groß → Kapazität bremst den Fluss nicht mehr ein.

### 3.2. `forward` und `backward` (RoleConfig)

Jeder Sensor hat **zwei** Rollenkonfigurationen. Die `timeline` entscheidet pro
Phase, welche aktiv ist. Beide Blöcke haben dieselbe Struktur:

```json
"forward": {
  "role": "SOURCE",
  "targets": ["SNSR-02-CORRIDOR"],
  "travel_time_sec": 15,
  "flow_rate": 0.20,
  "auto_growth": 10
}
```

#### 3.2.1. `role` (String, Pflicht)

Bestimmt das Grundverhalten des Sensors in der jeweiligen Phase.

| Rolle     | Pro Tick ausgeführt |
|-----------|---------------------|
| `SOURCE`  | Erzeugt `auto_growth` neue Einheiten → sendet `flow_rate × current_count` an `targets` |
| `TRANSIT` | Empfängt nur (über andere Sensoren) → sendet `flow_rate × current_count` weiter an `targets` |
| `SINK`    | Empfängt nur → entfernt `flow_rate × current_count` (Austritt aus Erfassungsbereich) |

#### 3.2.2. `targets` (Array von Sensor-IDs)

Die Nachfolgersensoren, an die Outflow geht.

| Wert                 | Effekt |
|----------------------|--------|
| `[]` (leer)          | Kein Outflow (Pflicht für `SINK`, bei `SOURCE`/`TRANSIT` wirkungslos) |
| 1 ID                 | Gesamter Outflow geht an diesen Sensor |
| Mehrere IDs          | Outflow wird **gleichmäßig aufgeteilt** (Rest-Einheiten auf erste Targets verteilt) |

> Unbekannte Target-IDs werden stillschweigend ignoriert.

#### 3.2.3. `travel_time_sec` (Int, Sekunden)

Verzögerung zwischen Verlassen **dieses** Sensors und Ankunft beim Target.
Intern wird in Ticks umgerechnet (`ceil(travel_time_sec / interval_sec)`, mind. 1).

| Wert | Effekt |
|------|--------|
| `0`  | Ankunft im **nächsten** Tick (Minimum) |
| `15`, `interval_sec=5` | 3 Ticks Verzögerung |
| Sehr groß | Einheiten "stauen" in der Transit-Queue; Target füllt sich verzögert |

**Im Transit sind Einheiten nicht sichtbar** — weder am Quell- noch am Ziel-Sensor. Sie tauchen erst bei Ankunft im `deviceCount` des Ziels auf.

#### 3.2.4. `flow_rate` (Double, 0.0–1.0)

**Anteil der aktuellen Population**, der pro Tick das Verhalten auslöst:

| Rolle     | Bedeutung der `flow_rate` |
|-----------|---------------------------|
| `SOURCE`  | Abgang an `targets` pro Tick |
| `TRANSIT` | Weitergabe an `targets` pro Tick |
| `SINK`    | Entfernung aus Erfassungsbereich pro Tick |

| Wert     | Effekt |
|----------|--------|
| `0.0`    | Kein Fluss — Population bleibt konstant (bzw. wächst nur durch `auto_growth`) |
| `0.10`   | 10 % der Population verlässt/wechselt pro Tick — langsamer Fluss |
| `0.50`   | Hälfte pro Tick — rasanter Fluss, starkes Pulsieren |
| `1.0`    | Komplette Population wechselt jeden Tick — kein Aufstauen möglich |

> Die Berechnung ist `floor(current_count × flow_rate)` — bei sehr kleinen Populationen (< 10)
> und niedrigen Raten kann der Fluss auf 0 abrunden. → Mindestens `flow_rate ≥ 1/current_count`
> wählen oder Population hochhalten.

#### 3.2.5. `auto_growth` (Int, nur `SOURCE`)

Absolute Anzahl neuer Einheiten pro Tick. Wird **vor** dem Outflow addiert und
danach auf `max_capacity` gekappt.

| Wert | Effekt |
|------|--------|
| `0`  | Keine Neugeneration (typisch für `TRANSIT`/`SINK`) |
| `10` | 10 neue Geräte pro Tick — moderate Zustromrate |
| `25` | Starker Zustrom (z. B. Großveranstaltung) |

> **Gleichgewicht:** Im Steady-State gilt `auto_growth ≈ flow_rate × current_count`,
> die Population pendelt sich bei ca. `auto_growth / flow_rate` ein (vor `max_capacity`-Kappung).

---

## 4. Wechselspiel der Parameter

### 4.1. Steady-State eines SOURCE

Ein SOURCE-Sensor erreicht bei stabilen Parametern eine Gleichgewichts-Population:

```
current_count_stable ≈ auto_growth / flow_rate   (gedeckelt durch max_capacity)
```

**Beispiel:** `auto_growth=10`, `flow_rate=0.20` → ca. 50 Geräte im Steady-State.

### 4.2. Staueffekt im TRANSIT

Wenn die Ankunftsrate (Outflow aller zeigender Vorgänger) größer ist als
`flow_rate × max_capacity` des TRANSIT, entsteht ein Stau — bis die Kapazität
hart greift und weitere Ankünfte verworfen werden.

### 4.3. Drain-Balance im SINK

Ein SINK wächst, solange Ankünfte > `flow_rate × current_count`. Bei
`flow_rate=0.30` und konstanter Zulieferung von 20/Tick pendelt sich die SINK-
Population bei ca. `20 / 0.30 ≈ 67` ein.

### 4.4. Transit-Verzögerung vs. Phasenlänge

Wenn `travel_time_sec` pro Hop hoch ist (z. B. 60 s bei `interval_sec=5` → 12 Ticks)
und `duration_ticks` kurz (z. B. 30), erreichen die ersten Einheiten das Ende der
Kette eventuell erst nach Phasenende. → Phasen immer **länger** als Summe aller
Transit-Zeiten der Kette planen.

---

## 5. Beispielhafte Szenarien

### 5.1. Sanfter Zustrom (Bürogebäude morgens)

```json
"forward": { "role": "SOURCE", "targets": ["..."], "travel_time_sec": 30, "flow_rate": 0.05, "auto_growth": 3 }
```
- Steady-State ~60 Personen, langsame Durchlaufzeit.

### 5.2. Stoßartiger Einlass (Stadion)

```json
"forward": { "role": "SOURCE", "targets": ["..."], "travel_time_sec": 10, "flow_rate": 0.30, "auto_growth": 50 }
```
- Steady-State ~167 Personen, hoher Durchsatz.

### 5.3. Langsames Ausleeren (SINK)

```json
"backward": { "role": "SINK", "targets": [], "travel_time_sec": 0, "flow_rate": 0.10, "auto_growth": 0 }
```
- Halbwertszeit ≈ 7 Ticks (`ln(2)/ln(1/0.9)`).

---

## 6. Validierungs-Checkliste

- [ ] Jede ID in `targets` existiert als `sensor.id`.
- [ ] `flow_rate` liegt im Intervall `[0.0, 1.0]`.
- [ ] Für Rolle `SINK` ist `targets: []` (sonst wirkungslos, aber irreführend).
- [ ] Für Rolle `SOURCE` ist `auto_growth > 0` (sonst versiegt die Quelle nach kurzer Zeit).
- [ ] `max_capacity` > zu erwartender Peak.
- [ ] `duration_ticks × interval_sec` > Summe aller `travel_time_sec` der längsten Kette.
