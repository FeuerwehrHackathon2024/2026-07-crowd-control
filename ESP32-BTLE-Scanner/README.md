# BTLE-Scanner fuer Raspberry Pi 5 (Debian)

C++-Portierung des ESP32-Projekts. Nutzt das integrierte Bluetooth des Pi 5 via **BlueZ HCI** und sendet die Anzahl eindeutiger BTLE-Stationen per HTTP POST.

## 1. Abhaengigkeiten installieren

```bash
sudo apt update
sudo apt install -y build-essential libbluetooth-dev libcurl4-openssl-dev
```

## 2. Konfiguration

In `btle_scanner.cpp` anpassen:

```cpp
static const char* SERVER_URL   = "http://deine-url.de/endpoint";
static const int   SCAN_SECONDS = 5;
static const int   HCI_DEV_ID   = 0;    // hci0
```

Pruefe mit `hciconfig`, welcher HCI-Adapter auf dem Pi verfuegbar ist:

```bash
hciconfig -a
```

## 3. Build

```bash
cd raspi5
make
```

## 4. Ausfuehren

### Variante A: als root
```bash
sudo ./btle_scanner
```

### Variante B: ohne root via Capabilities
```bash
make setcap
./btle_scanner
```

## 5. Als systemd-Service installieren

```bash
# Binary nach /usr/local/bin installieren inkl. Capabilities
make install

# Service-Unit installieren und aktivieren
sudo cp btle-scanner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now btle-scanner.service

# Status / Logs
systemctl status btle-scanner.service
journalctl -u btle-scanner.service -f
```

## 6. JSON-Telegramm

```json
{
  "cycle_seconds": 5,
  "count": 12
}
```

## Troubleshooting

| Problem | Loesung |
|--------|---------|
| `hci_open_dev: Permission denied` | `sudo` oder `make setcap` verwenden |
| `hci_open_dev: No such device` | `hciconfig hci0 up` oder `HCI_DEV_ID` anpassen |
| Bluetooth gesperrt | `rfkill unblock bluetooth` |
| Immer 0 Geraete | `bluetoothctl` schliessen (blockiert HCI-Scan) |
