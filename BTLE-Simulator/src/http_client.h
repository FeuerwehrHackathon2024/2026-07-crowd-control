#pragma once

#include <string>

void http_init();
void http_cleanup();
void post_json_async(const std::string& url, const std::string& body);
