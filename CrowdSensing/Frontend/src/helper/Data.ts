import Event from './MyEvent';

export type PositionCount = {
    id: number;
    lat: number;
    long: number;
    senderType: string;
    deviceCount: number;
    measureTime: string;
};

export type PositionCountCreate = Omit<PositionCount, 'id'>;

export type SenderTypeRange = {
    id: number;
    senderType: string;
    range: number;
};

export type SenderTypeRangeCreate = Omit<SenderTypeRange, 'id'>;

class Data {
    apiBasePath = "https://localhost:7240/api/v1/";

    private async handleFetch<T>(url: string, init?: RequestInit, loadingEvent = 'loading'): Promise<T> {
        try {
            Event.dispatch(loadingEvent, { status: true });
            const response = await fetch(url, init);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            if (response.status === 204) {
                return true as T;
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await response.json() as T;
            }

            return await response.text() as T;
        } finally {
            Event.dispatch(loadingEvent, { status: false });
        }
    }

    async getPositionCounts(): Promise<PositionCount[]> {
        return await this.handleFetch<PositionCount[]>(this.apiBasePath + "PositionCount");
    }

    async getPositionCountsByTime(from: string, to?: string): Promise<PositionCount[]> {
        const params = new URLSearchParams();
        params.set('from', from);
        if (to && to.trim()) {
            params.set('to', to);
        }

        return await this.handleFetch<PositionCount[]>(this.apiBasePath + `PositionCount/by-time?${params.toString()}`);
    }

    async getPositionCountById(id: number): Promise<PositionCount> {
        return await this.handleFetch<PositionCount>(this.apiBasePath + `PositionCount/${id}`);
    }

    async createPositionCount(positionCount: PositionCountCreate): Promise<PositionCount> {
        return await this.handleFetch<PositionCount>(this.apiBasePath + "PositionCount", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(positionCount)
        });
    }

    async updatePositionCount(id: number, positionCount: PositionCount): Promise<boolean> {
        return await this.handleFetch<boolean>(this.apiBasePath + `PositionCount/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(positionCount)
        });
    }

    async deletePositionCount(id: number): Promise<boolean> {
        return await this.handleFetch<boolean>(this.apiBasePath + `PositionCount/${id}`, {
            method: 'DELETE'
        });
    }

    async getSenderTypeRanges(): Promise<SenderTypeRange[]> {
        return await this.handleFetch<SenderTypeRange[]>(this.apiBasePath + "SenderTypeRange");
    }

    async getSenderTypeRangeById(id: number): Promise<SenderTypeRange> {
        return await this.handleFetch<SenderTypeRange>(this.apiBasePath + `SenderTypeRange/${id}`);
    }

    async createSenderTypeRange(senderTypeRange: SenderTypeRangeCreate): Promise<SenderTypeRange> {
        return await this.handleFetch<SenderTypeRange>(this.apiBasePath + "SenderTypeRange", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(senderTypeRange)
        });
    }

    async updateSenderTypeRange(id: number, senderTypeRange: SenderTypeRange): Promise<boolean> {
        return await this.handleFetch<boolean>(this.apiBasePath + `SenderTypeRange/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(senderTypeRange)
        });
    }

    async deleteSenderTypeRange(id: number): Promise<boolean> {
        return await this.handleFetch<boolean>(this.apiBasePath + `SenderTypeRange/${id}`, {
            method: 'DELETE'
        });
    }

    /* ----------------------
       Beispiele / Hilfsmethoden
       ---------------------- */
    async getJoke(): Promise<any> {
        return await this.handleFetch("https://api.chucknorris.io/jokes/random", undefined, 'loading');
    }

    async testSpinner() {
        try {
            Event.dispatch('loading', { status: true });
            setTimeout(() => { Event.dispatch('loading', { status: false }); }, 5000);
            return true;
        } catch (e) {
            Event.dispatch('loading', { status: false });
            throw e;
        }
    }
}

const dataInstance = new Data();
export default dataInstance as Data;