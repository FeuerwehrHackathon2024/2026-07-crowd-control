#pragma once

#include "types.h"

#include <atomic>
#include <string>
#include <unordered_map>

class Simulator {
public:
    explicit Simulator(SimulationConfig cfg);
    void run();
    void stop() { running_ = false; }

private:
    SimulationConfig cfg_;
    std::unordered_map<std::string, Sensor*> sensor_map_;
    long long tick_ = 0;
    std::atomic<bool> running_{true};

    void apply_tick_(const std::string& mode);
    void send_telegrams_();

    static std::string iso8601_now_();
    static std::string build_url_(const std::string& tpl, const std::string& id);
};
