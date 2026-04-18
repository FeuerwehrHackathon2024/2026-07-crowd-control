#include "http_client.h"

#include <curl/curl.h>

#include <cstdio>
#include <thread>

void http_init() {
    curl_global_init(CURL_GLOBAL_DEFAULT);
}

void http_cleanup() {
    curl_global_cleanup();
}

static size_t curl_sink(void*, size_t size, size_t nmemb, void*) {
    return size * nmemb;
}

static void post_sync(std::string url, std::string body) {
    CURL* curl = curl_easy_init();
    if (!curl) return;

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, static_cast<long>(body.size()));
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_sink);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

    const CURLcode rc = curl_easy_perform(curl);
    if (rc != CURLE_OK) {
        std::fprintf(stderr, "[HTTP] %s -> %s\n", url.c_str(), curl_easy_strerror(rc));
    }
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
}

void post_json_async(const std::string& url, const std::string& body) {
    std::thread(post_sync, url, body).detach();
}
