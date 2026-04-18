# Open Source Acknowledgements — BTLE-Scanner

Dieses Projekt nutzt die folgenden Open-Source-Komponenten.
Wir danken den jeweiligen Autoren und der Community für ihre Arbeit.

---

## BlueZ — Linux Bluetooth Protocol Stack

| Eigenschaft | Wert |
|---|---|
| Paket | `libbluetooth-dev` |
| Version | ≥ 5.x (Systempaket) |
| Lizenz | GNU General Public License v2.0 (GPL-2.0) |
| Webseite | <http://www.bluez.org/> |
| Quellcode | <https://git.kernel.org/pub/scm/bluetooth/bluez.git> |

BlueZ ist der offizielle Linux Bluetooth-Stack und stellt die HCI-API bereit, über die der BTLE-Scanner Bluetooth-Low-Energy-Werbepakete empfängt.

---

## libcurl

| Eigenschaft | Wert |
|---|---|
| Paket | `libcurl4-openssl-dev` |
| Version | ≥ 7.x (Systempaket) |
| Lizenz | curl License (MIT-ähnlich) |
| Webseite | <https://curl.se/> |
| Quellcode | <https://github.com/curl/curl> |

libcurl wird verwendet, um die gemessene Geräteanzahl per HTTP POST an den Backend-Server zu übertragen.

**Lizenztext (Auszug):**

```
COPYRIGHT AND PERMISSION NOTICE
Copyright (c) 1996-2024, Daniel Stenberg, <daniel@haxx.se>, and many contributors.
All rights reserved.
Permission to use, copy, modify, and distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright
notice and this permission notice appear in all copies.
```

Vollständiger Lizenztext: <https://curl.se/docs/copyright.html>

---

## OpenSSL

| Eigenschaft | Wert |
|---|---|
| Paket | `libssl-dev` (Abhängigkeit von libcurl4-openssl-dev) |
| Version | ≥ 3.x (Systempaket) |
| Lizenz | Apache License 2.0 |
| Webseite | <https://www.openssl.org/> |
| Quellcode | <https://github.com/openssl/openssl> |

OpenSSL stellt die TLS/SSL-Unterstützung für verschlüsselte HTTPS-Verbindungen bereit.

Vollständiger Lizenztext: <https://www.openssl.org/source/license.html>

---

## GNU C++ Standard Library (libstdc++)

| Eigenschaft | Wert |
|---|---|
| Teil von | GCC (GNU Compiler Collection) |
| Lizenz | GPL-3.0 mit GCC Runtime Library Exception |
| Webseite | <https://gcc.gnu.org/> |
| Quellcode | <https://gcc.gnu.org/git.html> |

Die C++17 Standard-Bibliothek (`<thread>`, `<atomic>`, `<chrono>`, `<set>`, `<string>` u. a.) wird als Teil des GCC-Toolchain verwendet.

---

## Linux Kernel POSIX APIs

| Eigenschaft | Wert |
|---|---|
| Lizenz | GPL-2.0 with Linux-syscall-note |
| Webseite | <https://kernel.org/> |

Der Scanner verwendet POSIX-Sockets (`AF_BLUETOOTH`, `SOCK_RAW`) sowie Standard-POSIX-Systemaufrufe (`ioctl`, `read`, `signal`).

---

*Erstellt am 2026-04-18 — BTLE-Scanner v1.0*
