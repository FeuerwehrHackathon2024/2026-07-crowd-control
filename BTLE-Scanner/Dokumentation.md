# BTLE-Scanner — Project Documentation

**Version:** 1.0
**Date:** 2026-04-17
**Target Platform:** Raspberry Pi 5 (Debian, C++)

---

## 1. Project Overview

The BTLE-Scanner captures the number of unique Bluetooth Low Energy stations within a defined measurement cycle and transmits the result via HTTP(S) POST as JSON to a web server.

### Goal
Capture the number of BTLE stations per measurement cycle — nothing more, nothing less.

### Components

| File | Purpose |
|-------|-------|
| `btle_scanner.cpp` | C++ source code (BlueZ HCI + libcurl) |
| `Makefile` | Build rules for Debian |
| `btle-scanner.service` | systemd unit for autostart |
| `README.md` | Quick-start guide |

---

## 2. Architecture & Functional Flow

The implementation follows a sequential flow, avoiding hardware and stack conflicts between BLE scanning and HTTP upload.

| Phase | Description |
|-------|-------------|
| 1. Initialisation | Bring up HCI adapter, set scan parameters |
| 2. Scan Phase | BLE scan for `SCAN_SECONDS` — collect unique MACs |
| 3. Count Phase | Determine the number of unique MAC addresses |
| 4. Send Phase | Issue HTTP(S) POST with JSON telegram |
| 5. Reset | Clear memory, start new cycle |

### Duplicate Avoidance
A BTLE device may send many advertising packets within a 5-second window. By using a `std::set<std::string>`, each MAC address is counted only once.

---

## 3. JSON Telegram

### Payload Structure

```json
{
  "lat": 0.000000,
  "long": 0.000000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-17T14:30:00Z"
}
```

### Fields

| Field | Type | Description |
|------|-----|-------------|
| `lat` | double | Geographic latitude of the station (WGS84) |
| `long` | double | Geographic longitude of the station (WGS84) |
| `senderType` | string | Fixed value `"BTLE"` |
| `deviceCount` | int | Number of unique BTLE stations in the cycle |
| `measureTime` | string | ISO 8601 timestamp in UTC (`YYYY-MM-DDTHH:MM:SSZ`) |

### HTTP Request

```
POST /endpoint HTTP/1.1
Host: your-server.com
Content-Type: application/json
```

---

## 4. Raspberry Pi 5 Implementation (Debian)

### System Requirements

- Debian 12 (Bookworm) 64-bit or Raspberry Pi OS
- Pi 5 integrated Bluetooth or external dongle
- Network connectivity to the target server

### Package Installation

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
cd BTLE-Scanner
make
```

The `Makefile` uses:
- Compiler: `g++`
- Flags: `-O2 -Wall -Wextra -std=c++17`
- Libs: `-lbluetooth -lcurl`

### Permissions

HCI access requires `CAP_NET_RAW` + `CAP_NET_ADMIN`:

```bash
# Option A: with sudo
sudo ./btle_scanner

# Option B: set capabilities on the binary (once)
make setcap
./btle_scanner
```

### Install as systemd Service

```bash
make install                                      # to /usr/local/bin
sudo cp btle-scanner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now btle-scanner.service
systemctl status btle-scanner.service
journalctl -u btle-scanner.service -f
```

### Code Configuration

```cpp
static const char* SERVER_URL   = "http://your-server.com/endpoint";
static const int   SCAN_SECONDS = 5;
static const int   HCI_DEV_ID   = 0;       // hci0

static const double SENDER_LAT  = 0.0;
static const double SENDER_LONG = 0.0;
static const char*  SENDER_TYPE = "BTLE";
```

---

## 5. HTTPS Support

libcurl is built with OpenSSL — HTTPS works by simply changing the URL.

```cpp
static const char* SERVER_URL = "https://your-server.com/endpoint";
```

### TLS Options

| Option | Value | Meaning |
|--------|------|-----------|
| `CURLOPT_SSL_VERIFYPEER` | 1 | Validate certificate |
| `CURLOPT_SSL_VERIFYHOST` | 2 | Check hostname |
| `CURLOPT_CAINFO` | Path | Optional: custom CA file |

System CAs are used from `/etc/ssl/certs/`. Load a custom CA file for self-signed certificates.

---

## 6. Directory Structure

```
BTLE-Scanner/
|-- Dokumentation.md             # this file
|-- Dokumentation.pdf            # this file as PDF
|-- README.md                    # quick-start guide
|-- btle_scanner.cpp             # C++ source code
|-- Makefile                     # build rules
`-- btle-scanner.service         # systemd unit
```

---

## 7. Troubleshooting

| Problem | Cause | Solution |
|--------|---------|---------|
| `hci_open_dev: Permission denied` | missing privileges | `sudo` or `make setcap` |
| `hci_open_dev: No such device` | adapter not present | `hciconfig hci0 up` |
| `Network is down` | hci0 DOWN or rfkill block | `rfkill unblock bluetooth` + `hciconfig hci0 up` |
| Bluetooth not installed | packages missing | `sudo apt install bluez libbluetooth-dev ...` |
| `SSL certificate problem` | CA store missing | `sudo update-ca-certificates` |
| Always 0 devices | `bluetoothctl` blocks HCI | `bluetoothctl exit` and try `systemctl stop bluetooth` |
| `EALREADY` on HCIDEVUP | adapter already active | not an error — ignored in code |
| Hostname not resolvable | DNS problem | `ping your-server.com` |

---

## 8. Extension Possibilities

- Differentiation by BTLE address type (Public/Random) as additional counters
- Detection of iBeacon / Eddystone via parsing of advertising data
- Local buffer and retry on HTTP errors
- Runtime configuration (e.g. via `config.json` or environment variables)
- Batch sending instead of individual POSTs

---

## 9. References

| Topic | Reference |
|-------|----------|
| BlueZ HCI API | `man hci` / `/usr/include/bluetooth/` |
| libcurl | https://curl.se/libcurl/c/ |
| JSON | RFC 8259 |
| ISO 8601 (time) | ISO 8601-1:2019 |

---

*End of documentation.*
