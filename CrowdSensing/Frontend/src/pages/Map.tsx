import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import i18n from '../helper/I18n';
import L from 'leaflet';
import 'leaflet.heat';
import Data from '../helper/Data';
import type { PositionCount, SenderTypeRange } from '../helper/Data';

const metersToPixels = (meters: number, latitude: number, zoom: number) => {
    const earthCircumference = 40075016.686;
    const latRad = (latitude * Math.PI) / 180;
    const metersPerPixel = (earthCircumference * Math.cos(latRad)) / Math.pow(2, zoom + 8);

    if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
        return 1;
    }

    return Math.max(1, meters / metersPerPixel);
};

const normalizeSenderType = (value: unknown) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().toLowerCase();
};

const HeatmapLayer = ({ data, senderTypeRanges }: { data: PositionCount[]; senderTypeRanges: SenderTypeRange[] }) => {
    const map = useMap();

    useEffect(() => {
        const heatLayers: L.Layer[] = [];
        const defaultRangeMeters = 100;

        const rangeBySenderType = new Map(
            senderTypeRanges.map((item) => {
                const key = normalizeSenderType(item.senderType);
                const rangeNumber = Number(item.range);
                const safeRange = Number.isFinite(rangeNumber) && rangeNumber > 0 ? rangeNumber : defaultRangeMeters;

                return [key, safeRange] as const;
            })
        );

        const groupedBySenderType = new Map<string, PositionCount[]>();
        data.forEach((point) => {
            if (!Number.isFinite(point.lat) || !Number.isFinite(point.long) || !Number.isFinite(point.deviceCount)) {
                return;
            }

            const key = normalizeSenderType(point.senderType);
            if (!groupedBySenderType.has(key)) {
                groupedBySenderType.set(key, []);
            }
            groupedBySenderType.get(key)!.push(point);
        });

        const drawLayers = () => {
            heatLayers.forEach((layer) => map.removeLayer(layer));
            heatLayers.length = 0;

            groupedBySenderType.forEach((points, senderTypeKey) => {
                if (points.length === 0) {
                    return;
                }

                const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
                const rangeMeters = rangeBySenderType.get(senderTypeKey) ?? defaultRangeMeters;
                const radiusPixels = metersToPixels(rangeMeters, avgLat, map.getZoom());
                const blurPixels = Math.max(8, radiusPixels * 0.6);

                const layer = (L.heatLayer as any)(
                    points.map((p) => [p.lat, p.long, p.deviceCount]),
                    {
                        radius: radiusPixels,
                        blur: blurPixels,
                        // Keep heat intensity independent from zoom-based scaling.
                        maxZoom: 0,
                    }
                ).addTo(map);

                heatLayers.push(layer);
            });
        };

        drawLayers();
        map.on('zoomend', drawLayers);

        return () => {
            map.off('zoomend', drawLayers);
            heatLayers.forEach((layer) => map.removeLayer(layer));
            heatLayers.length = 0;
        };
    }, [data, senderTypeRanges, map]);

    return null;
};


function MapPage() {
    const [data, setData] = useState<PositionCount[]>([]);
    const [senderTypeRanges, setSenderTypeRanges] = useState<SenderTypeRange[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
    const [reloadSeconds, setReloadSeconds] = useState('10');
    const [maxDataAgeSeconds, setMaxDataAgeSeconds] = useState('');

    const loadData = useCallback(async () => {
        try {
            setErrorMessage('');

            const ageSeconds = Number(maxDataAgeSeconds);
            const hasAgeFilter = Number.isFinite(ageSeconds) && ageSeconds > 0;
            const fromIso = hasAgeFilter
                ? new Date(Date.now() - ageSeconds * 1000).toISOString()
                : undefined;

            const [positions, ranges] = await Promise.all([
                hasAgeFilter && fromIso
                    ? Data.getPositionCountsByTime(fromIso)
                    : Data.getPositionCounts(),
                Data.getSenderTypeRanges(),
            ]);
            setData(positions);
            setSenderTypeRanges(ranges);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setErrorMessage(message);
        }
    }, [maxDataAgeSeconds]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!autoReloadEnabled) {
            return;
        }

        const seconds = Number(reloadSeconds);
        if (!Number.isFinite(seconds) || seconds <= 0) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void loadData();
        }, seconds * 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [autoReloadEnabled, reloadSeconds, loadData]);

    const visibleData = data;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em", justifyContent: "center", alignItems: "center", marginTop: "1em", marginBottom: "2em" }}>
            <h2>{i18n('Pages.Map.PageName')}</h2>
            {errorMessage ? (
                <div style={{ width: '92vw', maxWidth: '1200px', color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.35)', borderRadius: '0.6em', padding: '0.6em' }}>
                    {errorMessage}
                </div>
            ) : null}
            <div style={{ width: '92vw', maxWidth: '1200px', display: 'flex', alignItems: 'center', gap: '0.75em', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                    <input
                        type="checkbox"
                        checked={autoReloadEnabled}
                        onChange={(e) => setAutoReloadEnabled(e.target.checked)}
                    />
                    Auto-Reload
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                    alle
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={reloadSeconds}
                        onChange={(e) => setReloadSeconds(e.target.value)}
                        style={{ width: '80px' }}
                    />
                    Sekunden
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                    max. Datenalter
                    <input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="unbegrenzt"
                        value={maxDataAgeSeconds}
                        onChange={(e) => setMaxDataAgeSeconds(e.target.value)}
                        style={{ width: '110px' }}
                    />
                    Sekunden
                </label>
                <button type="button" onClick={() => { void loadData(); }}>Jetzt neu laden</button>
            </div>
            <MapContainer
                center={[48.333, 10.9]}
                zoom={8}
                style={{ width: 'min(1200px, 92vw)', height: '70vh', minHeight: '420px', borderRadius: '12px' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <HeatmapLayer data={visibleData} senderTypeRanges={senderTypeRanges} />
            </MapContainer>
            <span style={{ opacity: 0.8 }}>{visibleData.length} / {data.length} Punkte angezeigt</span>
        </div>
    );
}

export default MapPage;