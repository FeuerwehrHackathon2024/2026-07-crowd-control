#pragma once

#include <deque>
#include <string>
#include <vector>

struct RoleConfig {
    std::string role;                 // "SOURCE" | "TRANSIT" | "SINK"
    std::vector<std::string> targets; // IDs of downstream sensors
    int travel_time_sec = 0;          // Delay between leaving here and arriving at target
    double flow_rate = 0.0;           // Fraction of current population to move / drain per tick
    int auto_growth = 0;              // Units generated per tick (SOURCE only)
};

struct PendingArrival {
    long long arrival_tick = 0;
    int amount = 0;
};

struct Sensor {
    std::string id;
    double lat = 0.0;
    double lon = 0.0;
    int max_capacity = 0;
    RoleConfig forward;
    RoleConfig backward;

    int current_count = 0;
    std::deque<PendingArrival> incoming;
    std::string target_url;

    const RoleConfig& role_for(const std::string& mode) const {
        return mode == "backward" ? backward : forward;
    }
};

struct TimelinePhase {
    std::string mode;     // "forward" | "backward"
    int duration_ticks = 0;
    std::string label;
};

struct SimulationConfig {
    int interval_sec = 5;
    std::string target_backend_url_template;
    std::vector<TimelinePhase> timeline;
    std::vector<Sensor> sensors;
};
