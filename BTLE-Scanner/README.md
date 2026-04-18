# BTLE-Scanner for Raspberry Pi 5 (Debian)

C++ port of the ESP32 project. Uses the Pi 5's integrated Bluetooth via **BlueZ HCI** and sends the number of unique BTLE stations via HTTP POST.

## 1. Install Dependencies

```bash
sudo apt update
sudo apt install -y build-essential libbluetooth-dev libcurl4-openssl-dev
```

## 2. Configuration

Edit the constants in `btle_scanner.cpp`:

```cpp
static const char* SERVER_URL   = "http://your-server.com/endpoint";
static const int   SCAN_SECONDS = 5;
static const int   HCI_DEV_ID   = 0;    // hci0
```

Check which HCI adapter is available on the Pi using `hciconfig`:

```bash
hciconfig -a
```

## 3. Build

```bash
cd BTLE-Scanner
make
```

## 4. Run

### Option A: as root
```bash
sudo ./btle_scanner
```

### Option B: without root via Capabilities
```bash
make setcap
./btle_scanner
```

## 5. Install as systemd Service

```bash
# Install binary to /usr/local/bin including capabilities
make install

# Install and enable the service unit
sudo cp btle-scanner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now btle-scanner.service

# Status / Logs
systemctl status btle-scanner.service
journalctl -u btle-scanner.service -f
```

## 6. JSON Telegram

```json
{
  "lat": 0.000000,
  "long": 0.000000,
  "senderType": "BTLE",
  "deviceCount": 12,
  "measureTime": "2026-04-17T14:30:00Z"
}
```

## Troubleshooting

| Problem | Solution |
|--------|---------|
| `hci_open_dev: Permission denied` | Use `sudo` or `make setcap` |
| `hci_open_dev: No such device` | Run `hciconfig hci0 up` or adjust `HCI_DEV_ID` |
| Bluetooth blocked | `rfkill unblock bluetooth` |
| Always 0 devices | Close `bluetoothctl` (it blocks the HCI scan) |
