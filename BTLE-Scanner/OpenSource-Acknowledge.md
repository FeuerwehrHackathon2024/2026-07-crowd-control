# Open Source Acknowledgements — BTLE-Scanner

This project uses the following open-source components.
We thank the respective authors and the community for their work.

---

## BlueZ — Linux Bluetooth Protocol Stack

| Property | Value |
|---|---|
| Package | `libbluetooth-dev` |
| Version | ≥ 5.x (system package) |
| Licence | GNU General Public License v2.0 (GPL-2.0) |
| Website | <http://www.bluez.org/> |
| Source | <https://git.kernel.org/pub/scm/bluetooth/bluez.git> |

BlueZ is the official Linux Bluetooth stack and provides the HCI API through which the BTLE-Scanner receives Bluetooth Low Energy advertising packets.

---

## libcurl

| Property | Value |
|---|---|
| Package | `libcurl4-openssl-dev` |
| Version | ≥ 7.x (system package) |
| Licence | curl License (MIT-like) |
| Website | <https://curl.se/> |
| Source | <https://github.com/curl/curl> |

libcurl is used to transmit the measured device count via HTTP POST to the backend server.

**Licence text (excerpt):**

```
COPYRIGHT AND PERMISSION NOTICE
Copyright (c) 1996-2024, Daniel Stenberg, <daniel@haxx.se>, and many contributors.
All rights reserved.
Permission to use, copy, modify, and distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright
notice and this permission notice appear in all copies.
```

Full licence text: <https://curl.se/docs/copyright.html>

---

## OpenSSL

| Property | Value |
|---|---|
| Package | `libssl-dev` (dependency of libcurl4-openssl-dev) |
| Version | ≥ 3.x (system package) |
| Licence | Apache License 2.0 |
| Website | <https://www.openssl.org/> |
| Source | <https://github.com/openssl/openssl> |

OpenSSL provides TLS/SSL support for encrypted HTTPS connections.

Full licence text: <https://www.openssl.org/source/license.html>

---

## GNU C++ Standard Library (libstdc++)

| Property | Value |
|---|---|
| Part of | GCC (GNU Compiler Collection) |
| Licence | GPL-3.0 with GCC Runtime Library Exception |
| Website | <https://gcc.gnu.org/> |
| Source | <https://gcc.gnu.org/git.html> |

The C++17 standard library (`<thread>`, `<atomic>`, `<chrono>`, `<set>`, `<string>` etc.) is used as part of the GCC toolchain.

---

## Linux Kernel POSIX APIs

| Property | Value |
|---|---|
| Licence | GPL-2.0 with Linux-syscall-note |
| Website | <https://kernel.org/> |

The scanner uses POSIX sockets (`AF_BLUETOOTH`, `SOCK_RAW`) and standard POSIX system calls (`ioctl`, `read`, `signal`).

---

*Created on 2026-04-18 — BTLE-Scanner v1.0*
