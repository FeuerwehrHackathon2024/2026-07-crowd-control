import { createContext, useState, useCallback, useContext, type ReactNode } from 'react';
import LocalStorage from './LocalStorage';
import GeneralHelper from './GeneralHelper';

type ContextValues = Record<string, unknown>;

type AppStore = {
    ContextValues: ContextValues;
    setContextKey: (key: string, value: unknown) => void;
    removeContextKey: (key: string) => void;
    clearContext: () => void;
};

const defaultStore: AppStore = {
    ContextValues: {},
    setContextKey: () => { },
    removeContextKey: () => { },
    clearContext: () => { }
};

export const AppContext = createContext<AppStore>(defaultStore);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [ContextValues, setContextValues] = useState<ContextValues>(() => {
        const stored = LocalStorage.LoadItem<string>('uuid');
        const uuid = stored ?? GeneralHelper.generateUUID();
        if (!stored) LocalStorage.safeItem('uuid', uuid);
        return { uuid } as ContextValues;
    });

    const setContextKey = useCallback((key: string, value: unknown) => {
        setContextValues(prev => ({ ...prev, [key]: value }));
    }, []);

    const removeContextKey = useCallback((key: string) => {
        setContextValues(prev => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
        });
    }, []);

    const clearContext = useCallback(() => setContextValues({}), []);

    return (
        <AppContext.Provider value={{ ContextValues, setContextKey, removeContextKey, clearContext }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);