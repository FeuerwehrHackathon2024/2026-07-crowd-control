export class LocalStorageHelper {
  private prefix: string;

  constructor(prefix = "") {
    this.prefix = prefix;
  }

  private isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.localStorage;
  }

  private key(key: string) {
    return `${this.prefix}${key}`;
  }

  safeItem<T = any>(key: string, val: T): void {
    try {
      if (!this.isAvailable()) return;
      window.localStorage.setItem(this.key(key), JSON.stringify(val));
    } catch {
        console.log("LocalStorage save error");
    }
  }

  LoadItem<T = any>(key: string): T | null {
    try {
      if (!this.isAvailable()) return null;
      const raw = window.localStorage.getItem(this.key(key));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return (raw as unknown) as T;
      }
    } catch {
      return null;
    }
  }

  deleateItem(key: string): void {
    try {
      if (!this.isAvailable()) return;
      window.localStorage.removeItem(this.key(key));
    } catch {
      console.log("LocalStorage delete error");
    }
  }
}

const LocalStorage = new LocalStorageHelper();
export default LocalStorage;