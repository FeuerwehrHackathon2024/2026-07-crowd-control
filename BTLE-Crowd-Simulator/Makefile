CXX      ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -Wpedantic -Isrc
LDFLAGS  ?=
LDLIBS   ?= -lcurl -lpthread

TARGET := btle_crowd_simulator
SRC    := src/main.cpp src/simulator.cpp src/config.cpp src/http_client.cpp
OBJ    := $(SRC:.cpp=.o)

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $^ $(LDLIBS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

run: $(TARGET)
	./$(TARGET) config.json

clean:
	rm -f $(OBJ) $(TARGET)

# --- systemd Installation ---
PREFIX    ?= /usr/local
BINDIR    ?= $(PREFIX)/bin
CONFDIR   ?= /etc/btle-crowd-simulator
UNITDIR   ?= /etc/systemd/system
UNIT      := btle-crowd-simulator.service

install: $(TARGET)
	install -d $(DESTDIR)$(BINDIR)
	install -m 0755 $(TARGET) $(DESTDIR)$(BINDIR)/$(TARGET)
	install -d $(DESTDIR)$(CONFDIR)
	@if [ ! -f $(DESTDIR)$(CONFDIR)/config.json ]; then \
	  install -m 0644 config.json $(DESTDIR)$(CONFDIR)/config.json; \
	else \
	  echo "[skip] $(DESTDIR)$(CONFDIR)/config.json existiert bereits"; \
	fi
	install -d $(DESTDIR)$(UNITDIR)
	install -m 0644 $(UNIT) $(DESTDIR)$(UNITDIR)/$(UNIT)
	@echo ""
	@echo "Install abgeschlossen. Aktivieren mit:"
	@echo "  sudo systemctl daemon-reload"
	@echo "  sudo systemctl enable --now $(UNIT)"

uninstall:
	-systemctl disable --now $(UNIT) 2>/dev/null || true
	rm -f $(DESTDIR)$(BINDIR)/$(TARGET)
	rm -f $(DESTDIR)$(UNITDIR)/$(UNIT)
	@echo "Config unter $(CONFDIR) bleibt erhalten. Manuell entfernen falls gewuenscht."
	systemctl daemon-reload || true

.PHONY: all clean run install uninstall
