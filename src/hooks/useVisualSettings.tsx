import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface VisualSettings {
  // Colors
  primaryHue: number;
  accentHue: number;
  saturation: number;
  brightness: number;
  bgTint: number;

  // Typography
  fontFamily: 'system' | 'serif' | 'mono' | 'rounded' | 'condensed';
  fontWeight: 'light' | 'normal' | 'bold';
  letterSpacing: 'tight' | 'normal' | 'wide' | 'extra-wide';
  lineHeight: 'tight' | 'normal' | 'relaxed';

  // Borders & Corners
  borderRadius: 'none' | 'subtle' | 'medium' | 'rounded' | 'pill';
  borderWidth: 'none' | 'thin' | 'medium' | 'thick';
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  sectionAccent: 'left' | 'top' | 'full' | 'none' | 'bottom';

  // Cards & Surfaces
  cardStyle: 'flat' | 'elevated' | 'outlined' | 'glass' | 'gradient' | 'neumorphic';
  shadowIntensity: 'none' | 'subtle' | 'medium' | 'dramatic' | 'colored';
  surfaceBlur: number;

  // Animations
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast' | 'instant';
  transitionStyle: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'bounce' | 'spring';
  hoverEffect: 'none' | 'lift' | 'glow' | 'scale' | 'darken' | 'border';
  clickEffect: 'none' | 'ripple' | 'shrink' | 'flash';

  // Header
  headerStyle: 'solid' | 'gradient' | 'dark' | 'transparent' | 'glass';
  headerHeight: 'compact' | 'normal' | 'tall';

  // Buttons
  buttonStyle: 'default' | 'pill' | 'square' | 'ghost' | 'outline' | '3d';
  buttonSize: 'small' | 'medium' | 'large';

  // Spacing
  spacingScale: 'tight' | 'normal' | 'relaxed' | 'spacious';
  contentWidth: 'narrow' | 'normal' | 'wide' | 'full';

  // Effects
  glassEffect: boolean;
  gradientText: boolean;
  coloredShadows: boolean;
  animatedBackground: boolean;
  stripedLists: boolean;
  roundedAvatars: boolean;

  // Navigation
  navStyle: 'default' | 'minimal' | 'colorful' | 'floating' | 'pills';
  navPosition: 'bottom' | 'top';
  navIconSize: 'small' | 'medium' | 'large';

  // Lists
  listStyle: 'default' | 'cards' | 'minimal' | 'bordered' | 'zebra';
  listGap: 'none' | 'small' | 'medium' | 'large';

  // Inputs
  inputStyle: 'default' | 'underlined' | 'filled' | 'rounded' | 'minimal';

  // Badges
  badgeStyle: 'default' | 'pill' | 'square' | 'dot' | 'outline';

  // Dividers
  dividerStyle: 'line' | 'dashed' | 'dotted' | 'fade' | 'none';

  // Icons
  iconWeight: 'thin' | 'normal' | 'bold';

  // Modal
  modalBackdrop: 'dark' | 'blur' | 'light' | 'colored';
  modalAnimation: 'fade' | 'slide-up' | 'scale' | 'none';

  // Custom accent colors
  passColor: string;
  failColor: string;
  warningColor: string;
}

export const defaultVisualSettings: VisualSettings = {
  primaryHue: 217,
  accentHue: 262,
  saturation: 70,
  brightness: 50,
  bgTint: 0,

  fontFamily: 'system',
  fontWeight: 'normal',
  letterSpacing: 'normal',
  lineHeight: 'normal',

  borderRadius: 'medium',
  borderWidth: 'thin',
  borderStyle: 'solid',
  sectionAccent: 'left',

  cardStyle: 'elevated',
  shadowIntensity: 'medium',
  surfaceBlur: 0,

  animationSpeed: 'normal',
  transitionStyle: 'ease',
  hoverEffect: 'none',
  clickEffect: 'none',

  headerStyle: 'solid',
  headerHeight: 'normal',

  buttonStyle: 'default',
  buttonSize: 'medium',

  spacingScale: 'normal',
  contentWidth: 'normal',

  glassEffect: false,
  gradientText: false,
  coloredShadows: false,
  animatedBackground: false,
  stripedLists: false,
  roundedAvatars: false,

  navStyle: 'default',
  navPosition: 'bottom',
  navIconSize: 'medium',

  listStyle: 'default',
  listGap: 'none',

  inputStyle: 'default',
  badgeStyle: 'default',
  dividerStyle: 'line',
  iconWeight: 'normal',

  modalBackdrop: 'dark',
  modalAnimation: 'fade',

  passColor: '#16a34a',
  failColor: '#dc2626',
  warningColor: '#f59e0b',
};

const VISUAL_SETTINGS_KEY = 'barracks-inspection-visual';

interface VisualSettingsContextType {
  visual: VisualSettings;
  updateVisual: (updates: Partial<VisualSettings>) => void;
  resetVisual: () => void;
  presets: { name: string; settings: Partial<VisualSettings> }[];
  applyPreset: (name: string) => void;
}

const presets: { name: string; settings: Partial<VisualSettings> }[] = [
  {
    name: 'Military Standard',
    settings: {
      primaryHue: 142, accentHue: 45, saturation: 40, fontFamily: 'condensed',
      borderRadius: 'subtle', cardStyle: 'outlined', shadowIntensity: 'none',
      hoverEffect: 'darken', buttonStyle: 'square', headerStyle: 'dark',
      navStyle: 'minimal', animationSpeed: 'fast',
    },
  },
  {
    name: 'Modern Glass',
    settings: {
      primaryHue: 217, accentHue: 280, saturation: 80, glassEffect: true,
      borderRadius: 'rounded', cardStyle: 'glass', shadowIntensity: 'colored',
      hoverEffect: 'lift', transitionStyle: 'spring', buttonStyle: 'pill',
      headerStyle: 'glass', surfaceBlur: 12, modalBackdrop: 'blur',
      animatedBackground: true,
    },
  },
  {
    name: 'Minimal Clean',
    settings: {
      primaryHue: 0, accentHue: 0, saturation: 0, borderRadius: 'none',
      cardStyle: 'flat', shadowIntensity: 'none', borderWidth: 'thin',
      sectionAccent: 'none', hoverEffect: 'none', buttonStyle: 'ghost',
      headerStyle: 'transparent', navStyle: 'minimal', animationSpeed: 'none',
      dividerStyle: 'fade', fontWeight: 'light',
    },
  },
  {
    name: 'Bold & Vibrant',
    settings: {
      primaryHue: 330, accentHue: 45, saturation: 90, brightness: 55,
      borderRadius: 'pill', cardStyle: 'gradient', shadowIntensity: 'dramatic',
      hoverEffect: 'scale', clickEffect: 'ripple', buttonStyle: '3d',
      headerStyle: 'gradient', gradientText: true, coloredShadows: true,
      transitionStyle: 'bounce', animationSpeed: 'normal',
      navStyle: 'colorful', badgeStyle: 'pill',
    },
  },
  {
    name: 'Retro Terminal',
    settings: {
      primaryHue: 120, accentHue: 120, saturation: 100, brightness: 45,
      fontFamily: 'mono', borderRadius: 'none', cardStyle: 'outlined',
      borderWidth: 'medium', borderStyle: 'solid', shadowIntensity: 'colored',
      headerStyle: 'dark', buttonStyle: 'square', navStyle: 'minimal',
      animationSpeed: 'fast', transitionStyle: 'linear',
      passColor: '#00ff00', failColor: '#ff0000', warningColor: '#ffff00',
      inputStyle: 'underlined', coloredShadows: true,
    },
  },
  {
    name: 'Soft & Rounded',
    settings: {
      primaryHue: 200, accentHue: 320, saturation: 50, borderRadius: 'pill',
      cardStyle: 'neumorphic', shadowIntensity: 'subtle', hoverEffect: 'lift',
      buttonStyle: 'pill', fontFamily: 'rounded', spacingScale: 'relaxed',
      headerHeight: 'tall', navStyle: 'floating', navIconSize: 'large',
      transitionStyle: 'spring', listGap: 'medium', inputStyle: 'rounded',
    },
  },
];

const VisualSettingsContext = createContext<VisualSettingsContextType | null>(null);

export function VisualSettingsProvider({ children }: { children: ReactNode }) {
  const [visual, setVisual] = useState<VisualSettings>(() => {
    try {
      const stored = localStorage.getItem(VISUAL_SETTINGS_KEY);
      if (stored) {
        return { ...defaultVisualSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load visual settings:', e);
    }
    return defaultVisualSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(visual));
    } catch (e) {
      console.error('Failed to save visual settings:', e);
    }
  }, [visual]);

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--vs-primary-hue', String(visual.primaryHue));
    root.style.setProperty('--vs-accent-hue', String(visual.accentHue));
    root.style.setProperty('--vs-saturation', `${visual.saturation}%`);
    root.style.setProperty('--vs-brightness', `${visual.brightness}%`);
    root.style.setProperty('--vs-bg-tint', String(visual.bgTint));
    root.style.setProperty('--vs-pass-color', visual.passColor);
    root.style.setProperty('--vs-fail-color', visual.failColor);
    root.style.setProperty('--vs-warning-color', visual.warningColor);

    // Typography
    const fontMap: Record<string, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"SF Mono", "Fira Code", "Courier New", monospace',
      rounded: '"Nunito", "Poppins", -apple-system, sans-serif',
      condensed: '"Roboto Condensed", "Arial Narrow", sans-serif',
    };
    root.style.setProperty('--vs-font-family', fontMap[visual.fontFamily] || fontMap.system);
    root.style.setProperty('--vs-font-weight', visual.fontWeight === 'light' ? '300' : visual.fontWeight === 'bold' ? '700' : '400');
    const lsMap = { tight: '-0.025em', normal: '0', wide: '0.025em', 'extra-wide': '0.05em' };
    root.style.setProperty('--vs-letter-spacing', lsMap[visual.letterSpacing]);
    const lhMap = { tight: '1.25', normal: '1.5', relaxed: '1.75' };
    root.style.setProperty('--vs-line-height', lhMap[visual.lineHeight]);

    // Border radius
    const brMap = { none: '0', subtle: '4px', medium: '8px', rounded: '12px', pill: '9999px' };
    root.style.setProperty('--vs-border-radius', brMap[visual.borderRadius]);

    // Border width
    const bwMap = { none: '0', thin: '1px', medium: '2px', thick: '3px' };
    root.style.setProperty('--vs-border-width', bwMap[visual.borderWidth]);

    // Shadows
    const shadowMap: Record<string, string> = {
      none: 'none',
      subtle: '0 1px 2px rgba(0,0,0,0.05)',
      medium: '0 4px 6px -1px rgba(0,0,0,0.1)',
      dramatic: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
      colored: `0 4px 14px -3px hsla(${visual.primaryHue}, ${visual.saturation}%, ${visual.brightness}%, 0.3)`,
    };
    root.style.setProperty('--vs-shadow', shadowMap[visual.shadowIntensity]);

    // Animation speed
    const speedMap = { none: '0ms', slow: '500ms', normal: '200ms', fast: '100ms', instant: '0ms' };
    root.style.setProperty('--vs-transition-duration', speedMap[visual.animationSpeed]);

    // Transition timing
    const timingMap: Record<string, string> = {
      linear: 'linear', ease: 'ease', 'ease-in': 'ease-in', 'ease-out': 'ease-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
    root.style.setProperty('--vs-transition-timing', timingMap[visual.transitionStyle]);

    // Surface blur
    root.style.setProperty('--vs-surface-blur', `${visual.surfaceBlur}px`);

    // Spacing scale
    const spaceMap = { tight: '0.75', normal: '1', relaxed: '1.25', spacious: '1.5' };
    root.style.setProperty('--vs-spacing-scale', spaceMap[visual.spacingScale]);

    // Content width
    const cwMap = { narrow: '640px', normal: '1024px', wide: '1280px', full: '100%' };
    root.style.setProperty('--vs-content-width', cwMap[visual.contentWidth]);

    // Header height
    const hhMap = { compact: '48px', normal: '56px', tall: '72px' };
    root.style.setProperty('--vs-header-height', hhMap[visual.headerHeight]);

    // Toggle classes
    const classToggles: [boolean, string][] = [
      [visual.glassEffect, 'vs-glass'],
      [visual.gradientText, 'vs-gradient-text'],
      [visual.coloredShadows, 'vs-colored-shadows'],
      [visual.animatedBackground, 'vs-animated-bg'],
      [visual.stripedLists, 'vs-striped-lists'],
    ];
    classToggles.forEach(([enabled, className]) => {
      root.classList.toggle(className, enabled);
    });

    // Apply font family globally
    root.style.fontFamily = fontMap[visual.fontFamily] || fontMap.system;
    root.style.fontWeight = visual.fontWeight === 'light' ? '300' : visual.fontWeight === 'bold' ? '700' : '400';
    root.style.letterSpacing = lsMap[visual.letterSpacing];

  }, [visual]);

  const updateVisual = (updates: Partial<VisualSettings>) => {
    setVisual((prev) => ({ ...prev, ...updates }));
  };

  const resetVisual = () => {
    setVisual(defaultVisualSettings);
  };

  const applyPreset = (name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (preset) {
      setVisual({ ...defaultVisualSettings, ...preset.settings });
    }
  };

  return (
    <VisualSettingsContext.Provider value={{ visual, updateVisual, resetVisual, presets, applyPreset }}>
      {children}
    </VisualSettingsContext.Provider>
  );
}

export function useVisualSettings() {
  const context = useContext(VisualSettingsContext);
  if (!context) {
    throw new Error('useVisualSettings must be used within a VisualSettingsProvider');
  }
  return context;
}
