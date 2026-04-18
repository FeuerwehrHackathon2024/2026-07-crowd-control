import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import i18n from '../helper/I18n';
import L from 'leaflet';
import 'leaflet.heat';
import Data from '../helper/Data';
import type { PositionCount, SenderTypeRange } from '../helper/Data';
import { Button, Input } from '../components/Ui';

const metersToPixels = (meters: number, latitude: number, referenceZoom = 15) => {
    const earthCircumference = 40075016.686;
    const latRad = (latitude * Math.PI) / 180;
    const metersPerPixel = (earthCircumference * Math.cos(latRad)) / Math.pow(2, referenceZoom + 8);
    const visualScale = 1;

    if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
        return 6;
    }

    return clamp((meters / metersPerPixel) * visualScale, 6, 180);
};

const normalizeSenderType = (value: unknown) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().toLowerCase();
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const DEFAULT_HEAT_GRADIENT = {
    0.1: '#2b83ba',
    0.35: '#abdda4',
    0.6: '#ffffbf',
    0.8: '#fdae61',
    1.0: '#d7191c',
} as const;

const DEFAULT_HEAT_ALPHA = {
    0.1: 1,
    0.35: 1,
    0.6: 1,
    0.8: 1,
    1.0: 1,
} as const;

const DEFAULT_HEAT_VALUE_STOPS = {
    0.1: 1,
    0.35: 25,
    0.6: 100,
    0.8: 500,
    1.0: 1000,
} as const;

const hexToRgba = (hex: string, alpha: number) => {
    const safeAlpha = clamp(alpha, 0, 1);
    const sanitized = hex.trim().replace('#', '');

    const normalizedHex = sanitized.length === 3
        ? sanitized.split('').map((char) => char + char).join('')
        : sanitized;

    if (normalizedHex.length !== 6) {
        return `rgba(255,255,255,${safeAlpha})`;
    }

    const r = parseInt(normalizedHex.slice(0, 2), 16);
    const g = parseInt(normalizedHex.slice(2, 4), 16);
    const b = parseInt(normalizedHex.slice(4, 6), 16);

    if (![r, g, b].every((value) => Number.isFinite(value))) {
        return `rgba(255,255,255,${safeAlpha})`;
    }

    return `rgba(${r},${g},${b},${safeAlpha})`;
};

const scaleWeight = (value: number, min: number, max: number) => {
    if (!Number.isFinite(value)) {
        return 0.15;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        return 0.6;
    }

    const normalized = (value - min) / (max - min);
    return clamp(0.15 + normalized * 0.85, 0.15, 1);
};

const mapValueToGradientStop = (value: number, heatValueStops: Record<number, number>) => {
    if (!Number.isFinite(value)) {
        return 0.1;
    }

    const stops = Object.entries(heatValueStops)
        .map(([gradientStop, threshold]) => ({
            gradientStop: Number(gradientStop),
            threshold: Number(threshold),
        }))
        .filter((item) => Number.isFinite(item.gradientStop) && Number.isFinite(item.threshold))
        .sort((a, b) => a.threshold - b.threshold || a.gradientStop - b.gradientStop);

    if (stops.length === 0) {
        return 0.6;
    }

    if (value <= stops[0].threshold) {
        return stops[0].gradientStop;
    }

    for (let i = 1; i < stops.length; i += 1) {
        const previous = stops[i - 1];
        const current = stops[i];

        if (value <= current.threshold) {
            const thresholdDelta = current.threshold - previous.threshold;
            if (thresholdDelta <= 0) {
                return current.gradientStop;
            }

            const t = (value - previous.threshold) / thresholdDelta;
            return previous.gradientStop + t * (current.gradientStop - previous.gradientStop);
        }
    }

    return stops[stops.length - 1].gradientStop;
};

const HeatmapLayer = ({ data, senderTypeRanges, valueMultiplier, heatGradient, heatValueStops }: { data: PositionCount[]; senderTypeRanges: SenderTypeRange[]; valueMultiplier: number; heatGradient: Record<number, string>; heatValueStops: Record<number, number> }) => {
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

            const safeMultiplier = Number.isFinite(valueMultiplier) && valueMultiplier > 0 ? valueMultiplier : 1;
            const currentZoom = map.getZoom();

            groupedBySenderType.forEach((points, senderTypeKey) => {
                if (points.length === 0) {
                    return;
                }

                const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
                const rangeMeters = rangeBySenderType.get(senderTypeKey) ?? defaultRangeMeters;
                const radiusPixels = metersToPixels(rangeMeters, avgLat, 15);
                const blurPixels = clamp(radiusPixels * 0.6, 8, 72);

                const layer = (L.heatLayer as any)(
                    points.map((p) => {
                        const scaledCount = Number(p.deviceCount) * safeMultiplier;
                        const stopValue = mapValueToGradientStop(scaledCount, heatValueStops);
                        return [p.lat, p.long, clamp(stopValue, 0.1, 1.0)];
                    }),
                    {
                        radius: radiusPixels,
                        blur: blurPixels,
                        max: 1,
                        // Keep color/intensity stable while zooming.
                        maxZoom: currentZoom,
                        gradient: heatGradient,
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
    }, [data, senderTypeRanges, valueMultiplier, heatGradient, heatValueStops, map]);

    return null;
};

function MapPage() {
    const [data, setData] = useState<PositionCount[]>([]);
    const [senderTypeRanges, setSenderTypeRanges] = useState<SenderTypeRange[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
    const [reloadSeconds, setReloadSeconds] = useState('10');
    const [maxDataAgeSeconds, setMaxDataAgeSeconds] = useState('5');
    const [valueMultiplier, setValueMultiplier] = useState('1.0');
    const [gradientColor10, setGradientColor10] = useState(DEFAULT_HEAT_GRADIENT[0.1]);
    const [gradientColor35, setGradientColor35] = useState(DEFAULT_HEAT_GRADIENT[0.35]);
    const [gradientColor60, setGradientColor60] = useState(DEFAULT_HEAT_GRADIENT[0.6]);
    const [gradientColor80, setGradientColor80] = useState(DEFAULT_HEAT_GRADIENT[0.8]);
    const [gradientColor100, setGradientColor100] = useState(DEFAULT_HEAT_GRADIENT[1.0]);
    const [gradientAlpha10, setGradientAlpha10] = useState(String(DEFAULT_HEAT_ALPHA[0.1]));
    const [gradientAlpha35, setGradientAlpha35] = useState(String(DEFAULT_HEAT_ALPHA[0.35]));
    const [gradientAlpha60, setGradientAlpha60] = useState(String(DEFAULT_HEAT_ALPHA[0.6]));
    const [gradientAlpha80, setGradientAlpha80] = useState(String(DEFAULT_HEAT_ALPHA[0.8]));
    const [gradientAlpha100, setGradientAlpha100] = useState(String(DEFAULT_HEAT_ALPHA[1.0]));
    const [valueStop10, setValueStop10] = useState(String(DEFAULT_HEAT_VALUE_STOPS[0.1]));
    const [valueStop35, setValueStop35] = useState(String(DEFAULT_HEAT_VALUE_STOPS[0.35]));
    const [valueStop60, setValueStop60] = useState(String(DEFAULT_HEAT_VALUE_STOPS[0.6]));
    const [valueStop80, setValueStop80] = useState(String(DEFAULT_HEAT_VALUE_STOPS[0.8]));
    const [valueStop100, setValueStop100] = useState(String(DEFAULT_HEAT_VALUE_STOPS[1.0]));

    const loadData = useCallback(async () => {
        try {
            setErrorMessage('');

            const ageSeconds = Number(maxDataAgeSeconds);
            const hasAgeFilter = Number.isFinite(ageSeconds) && ageSeconds > 0;
            const fromIso = hasAgeFilter ? new Date(Date.now() - ageSeconds * 1000).toISOString() : undefined;

            const [positions, ranges] = await Promise.all([
                hasAgeFilter && fromIso ? Data.getPositionCountsByTime(fromIso) : Data.getPositionCounts(),
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
    const parsedValueMultiplier = Number(valueMultiplier);
    const parsedAlpha10 = Number(gradientAlpha10);
    const parsedAlpha35 = Number(gradientAlpha35);
    const parsedAlpha60 = Number(gradientAlpha60);
    const parsedAlpha80 = Number(gradientAlpha80);
    const parsedAlpha100 = Number(gradientAlpha100);
    const parsedValueStop10 = Number(valueStop10);
    const parsedValueStop35 = Number(valueStop35);
    const parsedValueStop60 = Number(valueStop60);
    const parsedValueStop80 = Number(valueStop80);
    const parsedValueStop100 = Number(valueStop100);
    const heatGradient = {
        0.1: hexToRgba(gradientColor10, Number.isFinite(parsedAlpha10) ? parsedAlpha10 : DEFAULT_HEAT_ALPHA[0.1]),
        0.35: hexToRgba(gradientColor35, Number.isFinite(parsedAlpha35) ? parsedAlpha35 : DEFAULT_HEAT_ALPHA[0.35]),
        0.6: hexToRgba(gradientColor60, Number.isFinite(parsedAlpha60) ? parsedAlpha60 : DEFAULT_HEAT_ALPHA[0.6]),
        0.8: hexToRgba(gradientColor80, Number.isFinite(parsedAlpha80) ? parsedAlpha80 : DEFAULT_HEAT_ALPHA[0.8]),
        1.0: hexToRgba(gradientColor100, Number.isFinite(parsedAlpha100) ? parsedAlpha100 : DEFAULT_HEAT_ALPHA[1.0]),
    };
    const heatValueStops = {
        0.1: Number.isFinite(parsedValueStop10) ? parsedValueStop10 : DEFAULT_HEAT_VALUE_STOPS[0.1],
        0.35: Number.isFinite(parsedValueStop35) ? parsedValueStop35 : DEFAULT_HEAT_VALUE_STOPS[0.35],
        0.6: Number.isFinite(parsedValueStop60) ? parsedValueStop60 : DEFAULT_HEAT_VALUE_STOPS[0.6],
        0.8: Number.isFinite(parsedValueStop80) ? parsedValueStop80 : DEFAULT_HEAT_VALUE_STOPS[0.8],
        1.0: Number.isFinite(parsedValueStop100) ? parsedValueStop100 : DEFAULT_HEAT_VALUE_STOPS[1.0],
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em', justifyContent: 'center', alignItems: 'center', marginTop: '1em', marginBottom: '2em' }}>
            <h2>{i18n('Pages.Map.PageName')}</h2>
            {errorMessage ? (
                <div style={{ width: '92vw', maxWidth: '1200px', color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.35)', borderRadius: '0.6em', padding: '0.6em' }}>
                    {errorMessage}
                </div>
            ) : null}

            <MapContainer
                center={[48.333, 10.9]}
                zoom={8}
                style={{ width: 'min(1200px, 92vw)', height: '60vh', minHeight: '420px', borderRadius: '12px' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <HeatmapLayer data={visibleData} senderTypeRanges={senderTypeRanges} valueMultiplier={parsedValueMultiplier} heatGradient={heatGradient} heatValueStops={heatValueStops} />
            </MapContainer>

            <div style={{ width: '92vw', maxWidth: '1200px', display: 'flex', alignItems: 'center', gap: '0.75em', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button bntType={autoReloadEnabled ? 1 : 4} onClick={() => setAutoReloadEnabled((value) => !value)}>
                    {autoReloadEnabled ? 'Auto-Reload: an' : 'Auto-Reload: aus'}
                </Button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', flexWrap: 'wrap' }}>
                    <span>alle</span>
                    <Input
                        type="int"
                        value={reloadSeconds}
                        onChange={(e) => setReloadSeconds(String(e.target.value))}
                        width="80px"
                        showStepper={false}
                    />
                    <span>Sekunden</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', flexWrap: 'wrap' }}>
                    <span>max. Datenalter</span>
                    <Input
                        type="int"
                        value={maxDataAgeSeconds}
                        onChange={(e) => setMaxDataAgeSeconds(String(e.target.value))}
                        width="110px"
                        placeholder="unbegrenzt"
                        showStepper={false}
                    />
                    <span>Sekunden</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', flexWrap: 'wrap' }}>
                    <span>Wertfaktor</span>
                    <Input
                        type="float"
                        value={valueMultiplier}
                        onChange={(e) => setValueMultiplier(String(e.target.value))}
                        width="110px"
                    />
                </div>

                <Button bntType={2} onClick={() => { void loadData(); }}>
                    Jetzt neu laden
                </Button>
            </div>

            <div style={{ width: '92vw', maxWidth: '1200px', display: 'flex', alignItems: 'center', gap: '0.75em', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>Heatmap Farben (Anzahl/ha):</span>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
                    10%
                    <input type="color" value={gradientColor10} onChange={(e) => setGradientColor10(e.target.value)} />
                    <span>a</span>
                    <Input type="float" value={gradientAlpha10} onChange={(e) => setGradientAlpha10(String(e.target.value))} width="80px" />
                    <span>/ha</span>
                    <Input type="float" value={valueStop10} onChange={(e) => setValueStop10(String(e.target.value))} width="90px" />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
                    35%
                    <input type="color" value={gradientColor35} onChange={(e) => setGradientColor35(e.target.value)} />
                    <span>a</span>
                    <Input type="float" value={gradientAlpha35} onChange={(e) => setGradientAlpha35(String(e.target.value))} width="80px" />
                    <span>/ha</span>
                    <Input type="float" value={valueStop35} onChange={(e) => setValueStop35(String(e.target.value))} width="90px" />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
                    60%
                    <input type="color" value={gradientColor60} onChange={(e) => setGradientColor60(e.target.value)} />
                    <span>a</span>
                    <Input type="float" value={gradientAlpha60} onChange={(e) => setGradientAlpha60(String(e.target.value))} width="80px" />
                    <span>/ha</span>
                    <Input type="float" value={valueStop60} onChange={(e) => setValueStop60(String(e.target.value))} width="90px" />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
                    80%
                    <input type="color" value={gradientColor80} onChange={(e) => setGradientColor80(e.target.value)} />
                    <span>a</span>
                    <Input type="float" value={gradientAlpha80} onChange={(e) => setGradientAlpha80(String(e.target.value))} width="80px" />
                    <span>/ha</span>
                    <Input type="float" value={valueStop80} onChange={(e) => setValueStop80(String(e.target.value))} width="90px" />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
                    100%
                    <input type="color" value={gradientColor100} onChange={(e) => setGradientColor100(e.target.value)} />
                    <span>a</span>
                    <Input type="float" value={gradientAlpha100} onChange={(e) => setGradientAlpha100(String(e.target.value))} width="80px" />
                    <span>/ha</span>
                    <Input type="float" value={valueStop100} onChange={(e) => setValueStop100(String(e.target.value))} width="90px" />
                </label>

                <Button
                    bntType={4}
                    onClick={() => {
                        setGradientColor10(DEFAULT_HEAT_GRADIENT[0.1]);
                        setGradientColor35(DEFAULT_HEAT_GRADIENT[0.35]);
                        setGradientColor60(DEFAULT_HEAT_GRADIENT[0.6]);
                        setGradientColor80(DEFAULT_HEAT_GRADIENT[0.8]);
                        setGradientColor100(DEFAULT_HEAT_GRADIENT[1.0]);
                        setGradientAlpha10(String(DEFAULT_HEAT_ALPHA[0.1]));
                        setGradientAlpha35(String(DEFAULT_HEAT_ALPHA[0.35]));
                        setGradientAlpha60(String(DEFAULT_HEAT_ALPHA[0.6]));
                        setGradientAlpha80(String(DEFAULT_HEAT_ALPHA[0.8]));
                        setGradientAlpha100(String(DEFAULT_HEAT_ALPHA[1.0]));
                        setValueStop10(String(DEFAULT_HEAT_VALUE_STOPS[0.1]));
                        setValueStop35(String(DEFAULT_HEAT_VALUE_STOPS[0.35]));
                        setValueStop60(String(DEFAULT_HEAT_VALUE_STOPS[0.6]));
                        setValueStop80(String(DEFAULT_HEAT_VALUE_STOPS[0.8]));
                        setValueStop100(String(DEFAULT_HEAT_VALUE_STOPS[1.0]));
                    }}
                >
                    Farben zuruecksetzen
                </Button>
            </div>

            <span style={{ opacity: 0.8 }}>{visibleData.length} / {data.length} Punkte angezeigt</span>
        </div>
    );
}

export default MapPage;