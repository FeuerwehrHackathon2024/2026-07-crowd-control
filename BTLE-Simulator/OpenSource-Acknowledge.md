# Open Source Acknowledgements — BTLE-Simulator

Dieses Projekt nutzt die folgenden Open-Source-Komponenten.
Wir danken den jeweiligen Autoren und der Community für ihre Arbeit.

---

## nlohmann/json — JSON for Modern C++

| Eigenschaft | Wert |
|---|---|
| Header | `<nlohmann/json.hpp>` |
| Version | ≥ 3.x |
| Lizenz | MIT License |
| Webseite | <https://json.nlohmann.me/> |
| Quellcode | <https://github.com/nlohmann/json> |

nlohmann/json wird für das Einlesen und Verarbeiten der Simulationskonfiguration (`config.json`) verwendet.

**Lizenztext:**

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

| Eigenschaft | Wert |
|---|---|
| Paket | `libcurl4-openssl-dev` |
| Version | ≥ 7.x (Systempaket) |
| Lizenz | curl License (MIT-ähnlich) |
| Webseite | <https://curl.se/> |
| Quellcode | <https://github.com/curl/curl> |

libcurl wird verwendet, um simulierte Sensordaten per HTTP POST asynchron an den Backend-Server zu übertragen.

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

Die C++17 Standard-Bibliothek (`<thread>`, `<atomic>`, `<chrono>`, `<fstream>`, `<string>` u. a.) wird als Teil des GCC-Toolchain verwendet.

---

## Linux Kernel POSIX APIs

| Eigenschaft | Wert |
|---|---|
| Lizenz | GPL-2.0 with Linux-syscall-note |
| Webseite | <https://kernel.org/> |

Der Simulator verwendet Standard-POSIX-Systemaufrufe (`signal`, POSIX-Threads via `<thread>`) für die asynchrone HTTP-Übertragung und Signalbehandlung.

---

*Erstellt am 2026-04-18 — BTLE-Simulator v1.0*
