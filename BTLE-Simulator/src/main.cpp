#include "config.h"
#include "http_client.h"
#include "simulator.h"

#include <atomic>
#include <csignal>
#include <cstdio>
#include <exception>

namespace {
std::atomic<bool> g_stop{false};
Simulator* g_sim = nullptr;

void on_sigint(int) {
    g_stop = true;
    if (g_sim) g_sim->stop();
}
}  // namespace

int main(int argc, char** argv) {
    const char* cfg_path = "config.json";
    if (argc >= 2) cfg_path = argv[1];

    SimulationConfig cfg;
    try {
        cfg = load_config(cfg_path);
    } catch (const std::exception& e) {
        std::fprintf(stderr, "[ERR] Failed to load config '%s': %s\n", cfg_path, e.what());
        return 1;
    }

    std::printf("[SIM] Loaded %zu sensors, %zu phases, interval=%ds\n",
                cfg.sensors.size(), cfg.timeline.size(), cfg.interval_sec);

    std::signal(SIGINT, on_sigint);
    std::signal(SIGTERM, on_sigint);

    http_init();
    int rc = 0;
    try {
        Simulator sim(std::move(cfg));
        g_sim = &sim;
        sim.run();
        g_sim = nullptr;
    } catch (const std::exception& e) {
        std::fprintf(stderr, "[ERR] %s\n", e.what());
        rc = 2;
    }
    http_cleanup();
    return rc;
}
