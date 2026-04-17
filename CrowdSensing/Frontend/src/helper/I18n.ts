import en from '../../public/i18n/en_US/translations.json';
import de from '../../public/i18n/de_DE/translations.json';

type Messages = Record<string, any>;
const MESSAGES: Messages = { en, de };

const getBrowserLang = () => {
    if (typeof navigator === 'undefined') return 'en';
    var lan = (navigator.language || (navigator as any).userLanguage || 'en').split('-')[0] || "en";
    return lan;
};

export class I18n {

    messages: Messages;
    private _locale: string;

    constructor(messages = MESSAGES) {
        this.messages = messages;
        this._locale = getBrowserLang();
    }

    private _msgs(loc = this._locale) {
        return this.messages[loc] || this.messages.en;
    }

    private _resolve(obj: any, key?: string) {
        if (!key) return undefined;
        return key.split('.').reduce((o: any, k: string) =>
            (o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined), obj);
    }

    setLocale(locale: string) {
        this._locale = (locale || 'en').split('-')[0];
        return this._locale;
    }

    getLocale() {
        return this._locale;
    }

    t(key: string) {
        const value = this._resolve(this._msgs(), key);
        return value === undefined ? key : value;
    }

    translate(key: string) {
        return this.t(key);
    }
}

const i18nInstance = new I18n();
export default function i18n(key: string) {
    return i18nInstance.t(key);
}
