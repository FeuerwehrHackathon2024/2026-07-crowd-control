/*
 * BTLE Scanner with HTTP Bridge - Raspberry Pi 5 / Debian port
 * -----------------------------------------------------------------
 * Cyclically scans for BTLE devices via BlueZ HCI and sends the
 * count of unique stations via HTTP POST to a web server.
 *
 * Build:   make
 * Deps:    libbluetooth-dev libcurl4-openssl-dev
 * Run:     sudo ./btle_scanner   (HCI requires CAP_NET_RAW or root)
 */

#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>

#include <curl/curl.h>

#include <atomic>
#include <chrono>
#include <csignal>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <set>
#include <string>
#include <thread>

#include <cerrno>
#include <sys/ioctl.h>
#include <sys/socket.h>
#include <unistd.h>

// ============ CONFIGURATION ============
static const char* SERVER_URL   = "http://deine-url.de/endpoint";
static const int   SCAN_SECONDS = 5;     // duration of one scan cycle
static const int   HCI_DEV_ID   = 0;     // hci0
static const bool  ACTIVE_SCAN  = true;  // true = send scan request
static const uint16_t SCAN_INTERVAL = 0x0010; // 10 ms (N * 0.625ms)
static const uint16_t SCAN_WINDOW   = 0x0010; // 10 ms

// --- message metadata ---
static const double SENDER_LAT  = 0.0;
static const double SENDER_LONG = 0.0;
static const char*  SENDER_TYPE = "BTLE";
// =======================================

static std::atomic<bool> g_running{true};

static void on_sigint(int) { g_running = false; }

// --- HTTP POST ---
static size_t curl_sink(void*, size_t size, size_t nmemb, void*) {
    return size * nmemb;
}

static bool post_count(size_t count) {
    CURL* curl = curl_easy_init();
    if (!curl) {
        fprintf(stderr, "[HTTP] curl_easy_init failed\n");
        return false;
    }

    // measureTime as ISO 8601 date/time in UTC (e.g. "2026-04-17T14:30:00Z")
    char measure_time[32];
    std::time_t now = std::time(nullptr);
    std::tm tm_utc;
    gmtime_r(&now, &tm_utc);
    std::strftime(measure_time, sizeof(measure_time), "%Y-%m-%dT%H:%M:%SZ", &tm_utc);

    char payload[512];
    snprintf(payload, sizeof(payload),
             "{"
               "\"lat\":%.6f,"
               "\"long\":%.6f,"
               "\"senderType\":\"%s\","
               "\"deviceCount\":%zu,"
               "\"measureTime\":\"%s\""
             "}",
             SENDER_LAT, SENDER_LONG,
             SENDER_TYPE, count, measure_time);

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, SERVER_URL);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_sink);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

    // --- TLS / HTTPS ---
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L); // verify certificate
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L); // verify hostname
    // Optional: custom CA file (e.g. for self-signed certs)
    // curl_easy_setopt(curl, CURLOPT_CAINFO, "/etc/ssl/certs/my_ca.crt");
    // FOR TESTING with self-signed only - do NOT use in production:
    // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
    // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);

    CURLcode res = curl_easy_perform(curl);
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);

    if (res == CURLE_OK) {
        printf("[HTTP] %ld  <- %s\n", http_code, payload);
    } else {
        fprintf(stderr, "[HTTP] Error: %s\n", curl_easy_strerror(res));
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    return res == CURLE_OK && http_code < 400;
}

// --- BLE-Scan (BlueZ HCI) ---
class BleScanner {
public:
    BleScanner() = default;
    ~BleScanner() { close_device(); }

    bool open() {
        dev_id_ = HCI_DEV_ID;

        // Bring adapter up if DOWN (fixes "Network is down")
        int ctl = socket(AF_BLUETOOTH, SOCK_RAW, BTPROTO_HCI);
        if (ctl >= 0) {
            if (ioctl(ctl, HCIDEVUP, dev_id_) < 0 && errno != EALREADY) {
                fprintf(stderr, "[BLE] HCIDEVUP(hci%d): %s\n",
                        dev_id_, strerror(errno));
                fprintf(stderr, "      Tip: try 'rfkill unblock bluetooth' "
                                "and 'sudo systemctl stop bluetooth'.\n");
                ::close(ctl);
                return false;
            }
            ::close(ctl);
        }

        sock_ = hci_open_dev(dev_id_);
        if (sock_ < 0) {
            perror("[BLE] hci_open_dev");
            return false;
        }

        // Cancel any running LE scan (otherwise set_scan_parameters fails)
        hci_le_set_scan_enable(sock_, 0x00, 0, 1000);

        // Set scan parameters (LE passive/active scan, public address)
        if (hci_le_set_scan_parameters(
                sock_,
                ACTIVE_SCAN ? 0x01 : 0x00,
                htobs(SCAN_INTERVAL),
                htobs(SCAN_WINDOW),
                0x00,   // own_type = public
                0x00,   // filter_policy = accept all
                1000) < 0) {
            perror("[BLE] hci_le_set_scan_parameters");
            return false;
        }
        return true;
    }

    // Scans for scan_seconds, returns set of unique MACs
    std::set<std::string> scan(int scan_seconds) {
        std::set<std::string> macs;

        if (hci_le_set_scan_enable(sock_, 0x01, 1 /*filter duplicates*/, 1000) < 0) {
            perror("[BLE] enable scan");
            return macs;
        }

        // Set HCI event filter
        struct hci_filter nf, of;
        socklen_t olen = sizeof(of);
        if (getsockopt(sock_, SOL_HCI, HCI_FILTER, &of, &olen) < 0) {
            perror("[BLE] getsockopt");
            hci_le_set_scan_enable(sock_, 0x00, 1, 1000);
            return macs;
        }
        hci_filter_clear(&nf);
        hci_filter_set_ptype(HCI_EVENT_PKT, &nf);
        hci_filter_set_event(EVT_LE_META_EVENT, &nf);
        if (setsockopt(sock_, SOL_HCI, HCI_FILTER, &nf, sizeof(nf)) < 0) {
            perror("[BLE] setsockopt");
            hci_le_set_scan_enable(sock_, 0x00, 1, 1000);
            return macs;
        }

        auto end = std::chrono::steady_clock::now()
                 + std::chrono::seconds(scan_seconds);

        unsigned char buf[HCI_MAX_EVENT_SIZE];
        while (g_running && std::chrono::steady_clock::now() < end) {
            ssize_t len = ::read(sock_, buf, sizeof(buf));
            if (len < 0) {
                if (errno == EAGAIN || errno == EINTR) continue;
                perror("[BLE] read");
                break;
            }
            if (len < 1 + HCI_EVENT_HDR_SIZE) continue;

            evt_le_meta_event* meta =
                reinterpret_cast<evt_le_meta_event*>(buf + 1 + HCI_EVENT_HDR_SIZE);

            if (meta->subevent != EVT_LE_ADVERTISING_REPORT) continue;

            le_advertising_info* info =
                reinterpret_cast<le_advertising_info*>(meta->data + 1);

            char addr[18];
            ba2str(&info->bdaddr, addr);
            macs.insert(addr);
        }

        // Stop scan & restore filter
        hci_le_set_scan_enable(sock_, 0x00, 1, 1000);
        setsockopt(sock_, SOL_HCI, HCI_FILTER, &of, sizeof(of));
        return macs;
    }

    void close_device() {
        if (sock_ >= 0) {
            hci_close_dev(sock_);
            sock_ = -1;
        }
    }

private:
    int dev_id_ = -1;
    int sock_   = -1;
};

// --- main ---
int main() {
    std::signal(SIGINT, on_sigint);
    std::signal(SIGTERM, on_sigint);

    curl_global_init(CURL_GLOBAL_DEFAULT);
    printf("=== Raspi 5 BTLE-Scanner ===\n");

    BleScanner scanner;
    if (!scanner.open()) {
        fprintf(stderr, "[BLE] Could not open HCI device.\n");
        fprintf(stderr, "      Tip: use 'sudo ./btle_scanner' or setcap permissions.\n");
        curl_global_cleanup();
        return 1;
    }

    while (g_running) {
        printf("[SCAN] starting %d s ...\n", SCAN_SECONDS);
        auto macs = scanner.scan(SCAN_SECONDS);
        printf("[SCAN] done. Unique stations: %zu\n", macs.size());

        post_count(macs.size());
    }

    printf("\n[EXIT] shutting down.\n");
    curl_global_cleanup();
    return 0;
}
