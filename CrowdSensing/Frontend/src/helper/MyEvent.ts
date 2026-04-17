class MyEvent {
    private events: { eventName: string; listener: EventListenerOrEventListenerObject }[] = [];

    public subscribe(eventName: string, listener: EventListenerOrEventListenerObject) {
        document.addEventListener(eventName, listener);
        this.events.push({ eventName, listener });
        return () => this.unsubscribeListener(eventName, listener);
    }

    private unsubscribeListener(eventName: string, listener: EventListenerOrEventListenerObject) {
        const idx = this.events.findIndex(e => e.eventName === eventName && e.listener === listener);
        if (idx === -1) return;
        document.removeEventListener(eventName, listener);
        this.events.splice(idx, 1);
    }

    public unsubscribe(eventName: string) {
        const toRemove = this.events.filter(e => e.eventName === eventName);
        toRemove.forEach(e => document.removeEventListener(e.eventName, e.listener));
        this.events = this.events.filter(e => e.eventName !== eventName);
    }

    public dispatch(eventName: string, detail?: any) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}

export default new MyEvent();