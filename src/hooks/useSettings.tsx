import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface AppSettings {
  textSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  highContrast: boolean;
}

const defaultSettings: AppSettings = {
  textSize: 'medium',
  compactMode: false,
  highContrast: false,
};

const SETTINGS_KEY = 'barracks-inspection-settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Apply text size to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${settings.textSize}`);

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [settings.textSize, settings.highContrast]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
