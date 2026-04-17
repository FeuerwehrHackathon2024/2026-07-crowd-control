# BTLE-Scanner — Projektdokumentation

**Version:** 1.0
**Datum:** 2026-04-17
**Zielplattform:** Raspberry Pi 5 (Debian, C++)

---

## 1. Projektueberblick

Der BTLE-Scanner erfasst die Anzahl eindeutiger Bluetooth-Low-Energy-Stationen in einem definierten Messzyklus und uebertraegt das Ergebnis per HTTP(S) POST als JSON an einen Webserver.

### Ziel
Erfassung der Anzahl von BTLE-Stationen pro Messzyklus — nicht mehr, nicht weniger.

### Komponenten

| Datei | Zweck |
|-------|-------|
| `btle_scanner.cpp` | C++-Quelltext (BlueZ HCI + libcurl) |
| `Makefile` | Build-Regeln fuer Debian |
| `btle-scanner.service` | systemd-Unit fuer Autostart |
| `README.md` | Kurzanleitung |

---

## 2. Architektur & Funktionsablauf

Die Implementierung folgt einem sequenziellen Ablauf. Dadurch werden Hardware- und Stack-Konflikte zwischen BLE-Scan und HTTP-Upload vermieden.

| Phase | Beschreibung |
|-------|-------------|
| 1. Initialisierung | HCI-Adapter hochfahren, Scan-Parameter setzen |
| 2. Scan-Phase | BLE-Scan fuer `SCAN_SECONDS` — eindeutige MACs sammeln |
| 3. Zaehl-Phase | Anzahl eindeutiger MAC-Adressen ermitteln |
| 4. Sende-Phase | HTTP(S) POST mit JSON-Telegramm absetzen |
| 5. Reset | Speicher leeren, neuer Zyklus |

### Duplikat-Vermeidung
Ein BTLE-Geraet sendet in einem 5-Sekunden-Fenster potenziell viele Advertising-Pakete. Durch Verwendung eines `std::set<std::string>` wird jede MAC-Adresse nur einmal gezaehlt.

---

## 3. JSON-Telegramm

### Payload-Struktur

```json
{
  "id": 0,
  "lat": 0.000000,
  "long": 0.000000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-17T14:30:00Z"
}
```

### Felder

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | int | Eindeutige ID des Senders (Station) |
| `lat` | double | Geografische Breite der Station (WGS84) |
| `long` | double | Geografische Laenge der Station (WGS84) |
| `senderType` | string | Fester Wert `"BTLE"` |
| `deviceCount` | int | Anzahl eindeutiger BTLE-Stationen im Zyklus |
| `measureTime` | string | ISO 8601 Zeitstempel in UTC (`YYYY-MM-DDTHH:MM:SSZ`) |

### HTTP-Request

```
POST /endpoint HTTP/1.1
Host: deine-url.de
Content-Type: application/json
```

---

## 4. Raspberry Pi 5 Implementierung (Debian)

### Systemvoraussetzungen

- Debian 12 (Bookworm) 64-bit oder Raspberry Pi OS
- Integriertes Bluetooth des Pi 5 oder externer Dongle
- Netzwerkverbindung zum Zielserver

### Paket-Installation

```bash
sudo apt update
sudo apt install -y \
    bluez \
    bluez-tools \
    rfkill \
    libbluetooth-dev \
    libcurl4-openssl-dev \
    ca-certificates \
    build-essential
sudo update-ca-certificates
sudo systemctl enable --now bluetooth
```

### Build

```bash
cd ESP32-BTLE-Scanner
make
```

Das `Makefile` nutzt:
- Compiler: `g++`
- Flags: `-O2 -Wall -Wextra -std=c++17`
- Libs: `-lbluetooth -lcurl`

### Berechtigungen

Der HCI-Zugriff erfordert `CAP_NET_RAW` + `CAP_NET_ADMIN`:

```bash
# Variante A: mit sudo
sudo ./btle_scanner

# Variante B: Capabilities am Binary setzen (einmalig)
make setcap
./btle_scanner
```

### Installation als systemd-Service

```bash
make install                                      # nach /usr/local/bin
sudo cp btle-scanner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now btle-scanner.service
systemctl status btle-scanner.service
journalctl -u btle-scanner.service -f
```

### Konfiguration im Code

```cpp
static const char* SERVER_URL   = "http://deine-url.de/endpoint";
static const int   SCAN_SECONDS = 5;
static const int   HCI_DEV_ID   = 0;       // hci0

static const int    SENDER_ID   = 0;
static const double SENDER_LAT  = 0.0;
static const double SENDER_LONG = 0.0;
static const char*  SENDER_TYPE = "BTLE";
```

---

## 5. HTTPS-Unterstuetzung

libcurl ist mit OpenSSL gebaut — HTTPS funktioniert durch blosse URL-Aenderung.

```cpp
static const char* SERVER_URL = "https://deine-url.de/endpoint";
```

### TLS-Optionen

| Option | Wert | Bedeutung |
|--------|------|-----------|
| `CURLOPT_SSL_VERIFYPEER` | 1 | Zertifikat validieren |
| `CURLOPT_SSL_VERIFYHOST` | 2 | Hostname pruefen |
| `CURLOPT_CAINFO` | Pfad | Optional: eigene CA-Datei |

System-CAs werden aus `/etc/ssl/certs/` verwendet. Fuer Self-Signed-Zertifikate eigene CA-Datei nachladen.

---

## 6. Verzeichnisstruktur

```
ESP32-BTLE-Scanner/
|-- Dokumentation.md             # diese Datei
|-- Dokumentation.pdf            # diese Datei als PDF
|-- Technisches_Konzept.md       # Design-Dokument
|-- README.md                    # Kurzanleitung
|
`-- ESP32-BTLE-Scanner/          # Quellverzeichnis
    |-- btle_scanner.cpp         # C++-Quelltext
    |-- Makefile                 # Build-Regeln
    |-- btle-scanner.service     # systemd-Unit
    `-- README.md                # Build-Hinweise
```

---

## 7. Troubleshooting

| Problem | Ursache | Loesung |
|--------|---------|---------|
| `hci_open_dev: Permission denied` | fehlende Rechte | `sudo` oder `make setcap` |
| `hci_open_dev: No such device` | Adapter nicht da | `hciconfig hci0 up` |
| `Network is down` | hci0 DOWN oder rfkill-Block | `rfkill unblock bluetooth` + `hciconfig hci0 up` |
| Bluetooth nicht installiert | Pakete fehlen | `sudo apt install bluez libbluetooth-dev ...` |
| `SSL certificate problem` | CA-Store fehlt | `sudo update-ca-certificates` |
| Immer 0 Geraete | `bluetoothctl` blockiert HCI | `bluetoothctl exit` und `systemctl stop bluetooth` probeweise |
| `EALREADY` beim HCIDEVUP | Adapter bereits aktiv | kein Fehler — wird im Code ignoriert |
| Hostname nicht aufloesbar | DNS-Problem | `ping deine-url.de` |

---

## 8. Erweiterungs-Moeglichkeiten

- Differenzierung nach BTLE-Adresstyp (Public/Random) als zusaetzliche Zaehler
- Erkennung von iBeacon / Eddystone via Parsing der Advertising-Daten
- Lokaler Puffer und Retry bei HTTP-Fehlern
- Konfiguration zur Laufzeit (z.B. per `config.json` oder Umgebungsvariablen)
- Batch-Versand statt Einzel-POST

---

## 9. Quellenhinweise

| Thema | Referenz |
|-------|----------|
| BlueZ HCI API | `man hci` / `/usr/include/bluetooth/` |
| libcurl | https://curl.se/libcurl/c/ |
| JSON | RFC 8259 |
| ISO 8601 (Zeit) | ISO 8601-1:2019 |

---

*Ende der Dokumentation.*
