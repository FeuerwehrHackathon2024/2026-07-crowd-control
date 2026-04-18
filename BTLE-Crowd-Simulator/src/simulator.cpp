#include "simulator.h"

#include "http_client.h"

#include <chrono>
#include <cmath>
#include <cstdio>
#include <ctime>
#include <thread>

Simulator::Simulator(SimulationConfig cfg) : cfg_(std::move(cfg)) {
    sensor_map_.reserve(cfg_.sensors.size());
    for (auto& s : cfg_.sensors) {
        s.target_url = build_url_(cfg_.target_backend_url_template, s.id);
        sensor_map_[s.id] = &s;
    }
}

void Simulator::run() {
    using namespace std::chrono;

    for (const auto& phase : cfg_.timeline) {
        if (!running_) break;
        std::printf("[SIM] Phase: %s (mode=%s, ticks=%d)\n",
                    phase.label.c_str(), phase.mode.c_str(), phase.duration_ticks);

        for (int i = 0; i < phase.duration_ticks && running_; ++i) {
            const auto t0 = steady_clock::now();

            apply_tick_(phase.mode);
            send_telegrams_();
            ++tick_;

            const auto elapsed_ms = duration_cast<milliseconds>(steady_clock::now() - t0).count();
            const long long target_ms = static_cast<long long>(cfg_.interval_sec) * 1000LL;
            if (elapsed_ms < target_ms) {
                std::this_thread::sleep_for(milliseconds(target_ms - elapsed_ms));
            }
        }
    }
}

void Simulator::apply_tick_(const std::string& mode) {
    // 1. Ankommende Einheiten aus Transit-Warteschlangen in current_count überführen
    for (auto& s : cfg_.sensors) {
        while (!s.incoming.empty() && s.incoming.front().arrival_tick <= tick_) {
            s.current_count += s.incoming.front().amount;
            s.incoming.pop_front();
        }
        if (s.current_count > s.max_capacity) s.current_count = s.max_capacity;
    }

    // 2. Rollenverhalten anwenden
    for (auto& s : cfg_.sensors) {
        const RoleConfig& r = s.role_for(mode);

        if (r.role == "SOURCE") {
            s.current_count += r.auto_growth;
            if (s.current_count > s.max_capacity) s.current_count = s.max_capacity;
        }

        if (r.role == "SOURCE" || r.role == "TRANSIT") {
            if (r.targets.empty()) continue;
            int outflow = static_cast<int>(std::floor(s.current_count * r.flow_rate));
            if (outflow <= 0) continue;

            s.current_count -= outflow;

            long long delay = static_cast<long long>(
                std::ceil(static_cast<double>(r.travel_time_sec) / cfg_.interval_sec));
            if (delay < 1) delay = 1;

            const int n_targets = static_cast<int>(r.targets.size());
            const int per = outflow / n_targets;
            int remainder = outflow % n_targets;

            for (const auto& tid : r.targets) {
                auto it = sensor_map_.find(tid);
                if (it == sensor_map_.end()) continue;
                int amount = per + (remainder > 0 ? 1 : 0);
                if (remainder > 0) --remainder;
                if (amount > 0) {
                    it->second->incoming.push_back({tick_ + delay, amount});
                }
            }
        } else if (r.role == "SINK") {
            const int drain = static_cast<int>(std::floor(s.current_count * r.flow_rate));
            s.current_count -= drain;
            if (s.current_count < 0) s.current_count = 0;
        }
    }
}

void Simulator::send_telegrams_() {
    const std::string ts = iso8601_now_();
    for (const auto& s : cfg_.sensors) {
        char payload[512];
        std::snprintf(payload, sizeof(payload),
                      "{"
                      "\"lat\":%.6f,"
                      "\"long\":%.6f,"
                      "\"senderType\":\"BTLE\","
                      "\"deviceCount\":%d,"
                      "\"measureTime\":\"%s\""
                      "}",
                      s.lat, s.lon, s.current_count, ts.c_str());

        std::printf("[TICK %lld] %-24s count=%-5d -> %s\n",
                    tick_, s.id.c_str(), s.current_count, s.target_url.c_str());

        post_json_async(s.target_url, payload);
    }
}

std::string Simulator::iso8601_now_() {
    const std::time_t now = std::time(nullptr);
    std::tm tm_utc{};
#ifdef _WIN32
    gmtime_s(&tm_utc, &now);
#else
    gmtime_r(&now, &tm_utc);
#endif
    char buf[32];
    std::strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tm_utc);
    return std::string(buf);
}

std::string Simulator::build_url_(const std::string& tpl, const std::string& id) {
    std::string url = tpl;
    const std::string placeholder = "{sensor_id}";
    const size_t pos = url.find(placeholder);
    if (pos != std::string::npos) {
        url.replace(pos, placeholder.size(), id);
    }
    return url;
}
