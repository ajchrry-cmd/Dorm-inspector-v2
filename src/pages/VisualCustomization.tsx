import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisualSettings, defaultVisualSettings } from '../hooks/useVisualSettings';
import type { VisualSettings } from '../hooks/useVisualSettings';

type SectionKey = 'presets' | 'colors' | 'appearance' | 'effects';

function Section({ title, icon, children, id, expanded, onToggle }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  id: SectionKey; expanded: boolean; onToggle: (id: SectionKey) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">{children}</div>}
    </div>
  );
}

function SliderSetting({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400 font-mono">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step || 1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
    </div>
  );
}

function OptionGrid<T extends string>({ label, value, options, onChange, columns }: {
  label: string; value: T; options: { value: T; label: string }[];
  onChange: (v: T) => void; columns?: number;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 block mb-2">{label}</label>
      <div className={`grid gap-1.5 ${columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              value === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function ColorInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
        <span className="text-xs text-gray-400 font-mono w-16">{value}</span>
      </div>
    </div>
  );
}

function HuePreview({ hue, saturation }: { hue: number; saturation: number }) {
  return (
    <div className="flex gap-1 mt-1">
      {[30, 40, 50, 60, 70].map((l) => (
        <div key={l} className="w-6 h-6 rounded"
          style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${l}%)` }} />
      ))}
    </div>
  );
}

export default function VisualCustomization() {
  const navigate = useNavigate();
  const { visual, updateVisual, resetVisual, presets, applyPreset } = useVisualSettings();
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['presets']));

  const toggleSection = (id: SectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isModified = JSON.stringify(visual) !== JSON.stringify(defaultVisualSettings);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 md:px-8 shadow-lg">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center">
            <button onClick={() => navigate('/settings')} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold">Visual Lab</h1>
              <p className="text-xs text-purple-200">Customize your theme</p>
            </div>
          </div>
          {isModified && (
            <button onClick={resetVisual}
              className="text-xs bg-white/20 px-3 py-1.5 rounded-full font-medium">
              Reset All
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 md:px-8 space-y-3 max-w-3xl mx-auto w-full pb-6">

        {/* Dark Mode Toggle */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {visual.darkMode ? (
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              <div>
                <span className="font-semibold text-gray-800">Dark Mode</span>
                <p className="text-xs text-gray-500">{visual.darkMode ? 'Dark theme enabled' : 'Light theme enabled'}</p>
              </div>
            </div>
            <button onClick={() => updateVisual({ darkMode: !visual.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors ${visual.darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${visual.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Presets */}
        <Section id="presets" title="Presets" expanded={expandedSections.has('presets')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}>
          <p className="text-xs text-gray-500 mb-2">Quick-apply a complete visual theme</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button key={preset.name} onClick={() => applyPreset(preset.name)}
                className="p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-left transition-colors">
                <span className="text-sm font-medium text-gray-700">{preset.name}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Colors */}
        <Section id="colors" title="Colors" expanded={expandedSections.has('colors')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}>
          <SliderSetting label="Primary Hue" value={visual.primaryHue} min={0} max={360} onChange={(v) => updateVisual({ primaryHue: v })} suffix="°" />
          <HuePreview hue={visual.primaryHue} saturation={visual.saturation} />
          <SliderSetting label="Accent Hue" value={visual.accentHue} min={0} max={360} onChange={(v) => updateVisual({ accentHue: v })} suffix="°" />
          <SliderSetting label="Saturation" value={visual.saturation} min={0} max={100} onChange={(v) => updateVisual({ saturation: v })} suffix="%" />
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <ColorInput label="Pass Color" value={visual.passColor} onChange={(v) => updateVisual({ passColor: v })} />
            <ColorInput label="Fail Color" value={visual.failColor} onChange={(v) => updateVisual({ failColor: v })} />
          </div>
        </Section>

        {/* Appearance */}
        <Section id="appearance" title="Appearance" expanded={expandedSections.has('appearance')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>}>
          <OptionGrid label="Border Radius" value={visual.borderRadius}
            options={[
              { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' },
              { value: 'medium', label: 'Medium' }, { value: 'rounded', label: 'Round' },
              { value: 'pill', label: 'Pill' },
            ]} onChange={(v) => updateVisual({ borderRadius: v as VisualSettings['borderRadius'] })} />
          <OptionGrid label="Card Style" value={visual.cardStyle} columns={3}
            options={[
              { value: 'flat', label: 'Flat' }, { value: 'elevated', label: 'Elevated' },
              { value: 'outlined', label: 'Outlined' }, { value: 'glass', label: 'Glass' },
            ]} onChange={(v) => updateVisual({ cardStyle: v as VisualSettings['cardStyle'] })} />
          <OptionGrid label="Shadow" value={visual.shadowIntensity}
            options={[
              { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' },
              { value: 'medium', label: 'Medium' }, { value: 'dramatic', label: 'Dramatic' },
            ]} onChange={(v) => updateVisual({ shadowIntensity: v as VisualSettings['shadowIntensity'] })} />
          <OptionGrid label="Button Style" value={visual.buttonStyle} columns={3}
            options={[
              { value: 'default', label: 'Default' }, { value: 'pill', label: 'Pill' },
              { value: 'square', label: 'Square' }, { value: 'outline', label: 'Outline' },
            ]} onChange={(v) => updateVisual({ buttonStyle: v as VisualSettings['buttonStyle'] })} />
        </Section>

        {/* Effects */}
        <Section id="effects" title="Effects" expanded={expandedSections.has('effects')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}>
          <OptionGrid label="Animation Speed" value={visual.animationSpeed} columns={4}
            options={[
              { value: 'none', label: 'Off' }, { value: 'fast', label: 'Fast' },
              { value: 'normal', label: 'Normal' }, { value: 'slow', label: 'Slow' },
            ]} onChange={(v) => updateVisual({ animationSpeed: v as VisualSettings['animationSpeed'] })} />
          <ToggleSetting label="Glass Effect" description="Frosted glass on surfaces" value={visual.glassEffect} onChange={(v) => updateVisual({ glassEffect: v })} />
          <ToggleSetting label="Gradient Text" description="Color gradients on headings" value={visual.gradientText} onChange={(v) => updateVisual({ gradientText: v })} />
          <ToggleSetting label="Animated Background" description="Subtle moving background" value={visual.animatedBackground} onChange={(v) => updateVisual({ animatedBackground: v })} />
        </Section>

        {/* Live Preview */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Live Preview</h3>
          <div className="space-y-2 border border-gray-200 rounded-lg p-3"
            style={{
              borderRadius: `var(--vs-border-radius)`,
              boxShadow: `var(--vs-shadow)`,
              fontFamily: `var(--vs-font-family)`,
              transition: `all var(--vs-transition-duration) var(--vs-transition-timing)`,
            }}>
            <div className="flex items-center justify-between p-2 rounded"
              style={{ borderRadius: `var(--vs-border-radius)` }}>
              <span className="font-medium">Room 201</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: visual.passColor + '20', color: visual.passColor }}>PASS</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded"
              style={{ borderRadius: `var(--vs-border-radius)` }}>
              <span className="font-medium">Room 202</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: visual.failColor + '20', color: visual.failColor }}>FAIL</span>
            </div>
            <button className="w-full py-2 rounded text-white text-sm font-medium mt-2"
              style={{
                backgroundColor: `hsl(${visual.primaryHue}, ${visual.saturation}%, 50%)`,
                borderRadius: `var(--vs-border-radius)`,
              }}>
              Sample Button
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
