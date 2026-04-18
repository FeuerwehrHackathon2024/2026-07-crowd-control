# Open Source Acknowledgements — BTLE-Simulator

This project uses the following open-source components.
We thank the respective authors and the community for their work.

---

## nlohmann/json — JSON for Modern C++

| Property | Value |
|---|---|
| Header | `<nlohmann/json.hpp>` |
| Version | ≥ 3.x |
| Licence | MIT License |
| Website | <https://json.nlohmann.me/> |
| Source | <https://github.com/nlohmann/json> |

nlohmann/json is used to read and process the simulation configuration (`config.json`).

**Licence text:**

```
MIT License
Copyright (c) 2013-2022 Niels Lohmann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## libcurl

| Property | Value |
|---|---|
| Package | `libcurl4-openssl-dev` |
| Version | ≥ 7.x (system package) |
| Licence | curl License (MIT-like) |
| Website | <https://curl.se/> |
| Source | <https://github.com/curl/curl> |

libcurl is used to transmit simulated sensor data asynchronously via HTTP POST to the backend server.

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

The C++17 standard library (`<thread>`, `<atomic>`, `<chrono>`, `<fstream>`, `<string>` etc.) is used as part of the GCC toolchain.

---

## Linux Kernel POSIX APIs

| Property | Value |
|---|---|
| Licence | GPL-2.0 with Linux-syscall-note |
| Website | <https://kernel.org/> |

The simulator uses standard POSIX system calls (`signal`, POSIX threads via `<thread>`) for asynchronous HTTP transmission and signal handling.

---

*Created on 2026-04-18 — BTLE-Simulator v1.0*
