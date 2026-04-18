#include "config.h"

#include <fstream>
#include <nlohmann/json.hpp>
#include <stdexcept>

using nlohmann::json;

static RoleConfig parse_role(const json& j) {
    RoleConfig r;
    r.role = j.at("role").get<std::string>();
    if (j.contains("targets")) {
        for (const auto& t : j["targets"]) r.targets.push_back(t.get<std::string>());
    }
    r.travel_time_sec = j.value("travel_time_sec", 0);
    r.flow_rate = j.value("flow_rate", 0.0);
    r.auto_growth = j.value("auto_growth", 0);
    return r;
}

SimulationConfig load_config(const std::string& path) {
    std::ifstream in(path);
    if (!in) throw std::runtime_error("Cannot open config file: " + path);

    json j;
    in >> j;

    SimulationConfig cfg;
    const auto& sc = j.at("simulation_control");
    cfg.interval_sec = sc.value("interval_sec", 5);
    cfg.target_backend_url_template = sc.at("target_backend_url_template").get<std::string>();

    for (const auto& t : sc.at("timeline")) {
        TimelinePhase p;
        p.mode = t.at("mode").get<std::string>();
        p.duration_ticks = t.at("duration_ticks").get<int>();
        p.label = t.value("label", "");
        cfg.timeline.push_back(std::move(p));
    }

    for (const auto& s : j.at("sensors")) {
        Sensor sensor;
        sensor.id = s.at("id").get<std::string>();
        sensor.lat = s.at("lat").get<double>();
        sensor.lon = s.at("lon").get<double>();
        sensor.max_capacity = s.at("max_capacity").get<int>();
        sensor.forward = parse_role(s.at("forward"));
        sensor.backward = parse_role(s.at("backward"));
        cfg.sensors.push_back(std::move(sensor));
    }

    return cfg;
}
