# Makefile fuer btle_scanner (Raspberry Pi 5 / Debian)
#
# Build-Abhaengigkeiten (einmalig):
#   sudo apt update
#   sudo apt install -y build-essential libbluetooth-dev libcurl4-openssl-dev

CXX      ?= g++
CXXFLAGS ?= -O2 -Wall -Wextra -std=c++17
LDLIBS    = -lbluetooth -lcurl

TARGET = btle_scanner
SRC    = btle_scanner.cpp

.PHONY: all clean install uninstall setcap run

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) -o $@ $< $(LDLIBS)

clean:
	rm -f $(TARGET)

# HCI-Rechte ohne root: CAP_NET_RAW + CAP_NET_ADMIN am Binary setzen
setcap: $(TARGET)
	sudo setcap 'cap_net_raw,cap_net_admin+eip' $(TARGET)

run: $(TARGET)
	sudo ./$(TARGET)

install: $(TARGET)
	sudo install -m 0755 $(TARGET) /usr/local/bin/$(TARGET)
	sudo setcap 'cap_net_raw,cap_net_admin+eip' /usr/local/bin/$(TARGET)

uninstall:
	sudo rm -f /usr/local/bin/$(TARGET)
