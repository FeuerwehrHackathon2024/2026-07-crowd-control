import { useEffect, useState } from 'react';
import i18n from '../helper/I18n';
import { Button, Input } from '../components/Ui';
import Data from '../helper/Data';
import type { PositionCount, PositionCountCreate, SenderTypeRange, SenderTypeRangeCreate } from '../helper/Data';

function Database() {
    const [positionCounts, setPositionCounts] = useState<PositionCount[]>([]);
    const [senderTypeRanges, setSenderTypeRanges] = useState<SenderTypeRange[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    const [pcLat, setPcLat] = useState('');
    const [pcLong, setPcLong] = useState('');
    const [pcSenderType, setPcSenderType] = useState('');
    const [pcDeviceCount, setPcDeviceCount] = useState('');
    const [pcMeasureTime, setPcMeasureTime] = useState('');
    const [pcFromTime, setPcFromTime] = useState('');
    const [pcToTime, setPcToTime] = useState('');

    const [strSenderType, setStrSenderType] = useState('');
    const [strRange, setStrRange] = useState('');

    const safeLoad = async <T,>(loader: () => Promise<T>) => {
        try {
            setErrorMessage('');
            return await loader();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setErrorMessage(message);
            throw error;
        }
    };

    const reloadPositionCounts = async () => {
        const data = await safeLoad(() => Data.getPositionCounts());
        setPositionCounts(data);
    };

    const reloadPositionCountsByTime = async () => {
        if (!pcFromTime.trim()) {
            alert('from is required');
            return;
        }

        const fromIso = new Date(pcFromTime).toISOString();
        const toIso = pcToTime.trim() ? new Date(pcToTime).toISOString() : undefined;

        if (Number.isNaN(new Date(fromIso).getTime())) {
            alert('from is not a valid datetime');
            return;
        }
        if (toIso && Number.isNaN(new Date(toIso).getTime())) {
            alert('to is not a valid datetime');
            return;
        }

        const data = await safeLoad(() => Data.getPositionCountsByTime(fromIso, toIso));
        setPositionCounts(data);
    };

    const reloadSenderTypeRanges = async () => {
        const data = await safeLoad(() => Data.getSenderTypeRanges());
        setSenderTypeRanges(data);
    };

    useEffect(() => {
        void reloadPositionCounts();
        void reloadSenderTypeRanges();
    }, []);

    const createPositionCount = async () => {
        const lat = Number(pcLat);
        const long = Number(pcLong);
        const deviceCount = Number(pcDeviceCount);

        if (!pcSenderType.trim()) {
            alert('senderType is required');
            return;
        }
        if (Number.isNaN(lat) || Number.isNaN(long) || Number.isNaN(deviceCount)) {
            alert('lat, long and deviceCount must be valid numbers');
            return;
        }

        const payload: PositionCountCreate = {
            lat,
            long,
            senderType: pcSenderType.trim(),
            deviceCount,
            measureTime: pcMeasureTime || new Date().toISOString()
        };

        await safeLoad(() => Data.createPositionCount(payload));
        await reloadPositionCounts();

        setPcLat('');
        setPcLong('');
        setPcSenderType('');
        setPcDeviceCount('');
        setPcMeasureTime('');
    };

    const createSenderTypeRange = async () => {
        const range = Number(strRange);

        if (!strSenderType.trim()) {
            alert('senderType is required');
            return;
        }
        if (Number.isNaN(range)) {
            alert('range must be a valid number');
            return;
        }

        const payload: SenderTypeRangeCreate = {
            senderType: strSenderType.trim(),
            range
        };

        await safeLoad(() => Data.createSenderTypeRange(payload));
        await reloadSenderTypeRanges();

        setStrSenderType('');
        setStrRange('');
    };

    const deletePositionCount = async (id: number) => {
        await safeLoad(() => Data.deletePositionCount(id));
        await reloadPositionCounts();
    };

    const deleteSenderTypeRange = async (id: number) => {
        await safeLoad(() => Data.deleteSenderTypeRange(id));
        await reloadSenderTypeRanges();
    };

    // UI
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1em", justifyContent: "center", alignItems: "center", marginTop: "1em", marginBottom: "2em" }}>
            <h2>{i18n('Pages.Database.PageName')}</h2>
            <span style={{ maxWidth: '95%', opacity: 0.8 }}>
                Data schema: PositionCount + SenderTypeRange
            </span>
            {errorMessage ? (
                <div style={{ width: '95%', color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.35)', borderRadius: '0.6em', padding: '0.6em' }}>
                    {errorMessage}
                </div>
            ) : null}

            <section style={{ width: "95%" }}>
                <h3>PositionCount</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5em', marginBottom: '0.5em' }}>
                    <Input type="text" placeholder="lat" value={pcLat} onChange={(e: any) => setPcLat(e.target.value)} />
                    <Input type="text" placeholder="long" value={pcLong} onChange={(e: any) => setPcLong(e.target.value)} />
                    <Input type="text" placeholder="senderType" value={pcSenderType} onChange={(e: any) => setPcSenderType(e.target.value)} />
                    <Input type="text" placeholder="deviceCount" value={pcDeviceCount} onChange={(e: any) => setPcDeviceCount(e.target.value)} />
                    <Input type="text" placeholder="measureTime (ISO, optional)" value={pcMeasureTime} onChange={(e: any) => setPcMeasureTime(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5em', marginBottom: '0.5em' }}>
                    <Input type="text" placeholder="from (ISO or local datetime)" value={pcFromTime} onChange={(e: any) => setPcFromTime(e.target.value)} />
                    <Input type="text" placeholder="to (optional, default = now)" value={pcToTime} onChange={(e: any) => setPcToTime(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                    <Button style={{ minWidth: 'fit-content' }} bntType={1} onClick={createPositionCount}>Create PositionCount</Button>
                    <Button bntType={2} onClick={reloadPositionCounts}>Reload PositionCount</Button>
                    <Button bntType={2} onClick={reloadPositionCountsByTime}>Load by Time</Button>
                </div>
                <div style={{ display: 'grid', gap: '0.5em', marginTop: '0.75em' }}>
                    {positionCounts.map(item => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.5em', background: 'var(--bg-secondary)', padding: 8, borderRadius: '0.5em' }}>
                            <span>
                                #{item.id} | {item.senderType} | {item.deviceCount} devices | ({item.lat}, {item.long}) | {item.measureTime}
                            </span>
                            <Button bntType={3} onClick={() => { void deletePositionCount(item.id); }}>Delete</Button>
                        </div>
                    ))}
                </div>

                <h3 style={{ marginTop: '1.25em' }}>SenderTypeRange</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5em', marginBottom: '0.5em' }}>
                    <Input type="text" placeholder="senderType" value={strSenderType} onChange={(e: any) => setStrSenderType(e.target.value)} />
                    <Input type="text" placeholder="range" value={strRange} onChange={(e: any) => setStrRange(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.5em', flexWrap: 'wrap' }}>
                    <Button style={{ minWidth: 'fit-content' }} bntType={1} onClick={createSenderTypeRange}>Create SenderTypeRange</Button>
                    <Button bntType={2} onClick={reloadSenderTypeRanges}>Reload SenderTypeRange</Button>
                </div>
                <div style={{ display: 'grid', gap: '0.5em', marginTop: '0.75em' }}>
                    {senderTypeRanges.map(item => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.5em', background: 'var(--bg-secondary)', padding: 8, borderRadius: '0.5em' }}>
                            <span>
                                #{item.id} | {item.senderType} | range: {item.range}
                            </span>
                            <Button bntType={3} onClick={() => { void deleteSenderTypeRange(item.id); }}>Delete</Button>
                        </div>
                    ))}
                </div>
                <br />
            </section>
        </div>
    );
}

export default Database;