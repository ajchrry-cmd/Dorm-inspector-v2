import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisualSettings, defaultVisualSettings } from '../hooks/useVisualSettings';
import type { VisualSettings } from '../hooks/useVisualSettings';

type SectionKey = 'colors' | 'typography' | 'borders' | 'cards' | 'animations' | 'header' | 'buttons' | 'spacing' | 'effects' | 'navigation' | 'lists' | 'inputs' | 'modals' | 'presets';

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
              <p className="text-xs text-purple-200">Customize every detail</p>
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
          <HuePreview hue={visual.accentHue} saturation={visual.saturation} />
          <SliderSetting label="Saturation" value={visual.saturation} min={0} max={100} onChange={(v) => updateVisual({ saturation: v })} suffix="%" />
          <SliderSetting label="Brightness" value={visual.brightness} min={20} max={80} onChange={(v) => updateVisual({ brightness: v })} suffix="%" />
          <SliderSetting label="Background Tint" value={visual.bgTint} min={0} max={360} onChange={(v) => updateVisual({ bgTint: v })} suffix="°" />
          <div className="border-t border-gray-100 pt-3 space-y-3">
            <ColorInput label="Pass Color" value={visual.passColor} onChange={(v) => updateVisual({ passColor: v })} />
            <ColorInput label="Fail Color" value={visual.failColor} onChange={(v) => updateVisual({ failColor: v })} />
            <ColorInput label="Warning Color" value={visual.warningColor} onChange={(v) => updateVisual({ warningColor: v })} />
          </div>
        </Section>

        {/* Typography */}
        <Section id="typography" title="Typography" expanded={expandedSections.has('typography')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>}>
          <OptionGrid label="Font Family" value={visual.fontFamily} columns={3}
            options={[
              { value: 'system', label: 'System' }, { value: 'serif', label: 'Serif' },
              { value: 'mono', label: 'Mono' }, { value: 'rounded', label: 'Rounded' },
              { value: 'condensed', label: 'Condensed' },
            ]} onChange={(v) => updateVisual({ fontFamily: v as VisualSettings['fontFamily'] })} />
          <OptionGrid label="Font Weight" value={visual.fontWeight}
            options={[
              { value: 'light', label: 'Light' }, { value: 'normal', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
            ]} onChange={(v) => updateVisual({ fontWeight: v as VisualSettings['fontWeight'] })} />
          <OptionGrid label="Letter Spacing" value={visual.letterSpacing} columns={4}
            options={[
              { value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Wide' }, { value: 'extra-wide', label: 'X-Wide' },
            ]} onChange={(v) => updateVisual({ letterSpacing: v as VisualSettings['letterSpacing'] })} />
          <OptionGrid label="Line Height" value={visual.lineHeight}
            options={[
              { value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Relaxed' },
            ]} onChange={(v) => updateVisual({ lineHeight: v as VisualSettings['lineHeight'] })} />
        </Section>

        {/* Borders & Corners */}
        <Section id="borders" title="Borders & Corners" expanded={expandedSections.has('borders')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>}>
          <OptionGrid label="Border Radius" value={visual.borderRadius}
            options={[
              { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' },
              { value: 'medium', label: 'Medium' }, { value: 'rounded', label: 'Round' },
              { value: 'pill', label: 'Pill' },
            ]} onChange={(v) => updateVisual({ borderRadius: v as VisualSettings['borderRadius'] })} />
          <OptionGrid label="Border Width" value={visual.borderWidth} columns={4}
            options={[
              { value: 'none', label: 'None' }, { value: 'thin', label: 'Thin' },
              { value: 'medium', label: 'Medium' }, { value: 'thick', label: 'Thick' },
            ]} onChange={(v) => updateVisual({ borderWidth: v as VisualSettings['borderWidth'] })} />
          <OptionGrid label="Border Style" value={visual.borderStyle} columns={4}
            options={[
              { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' }, { value: 'double', label: 'Double' },
            ]} onChange={(v) => updateVisual({ borderStyle: v as VisualSettings['borderStyle'] })} />
          <OptionGrid label="Section Accent" value={visual.sectionAccent}
            options={[
              { value: 'left', label: 'Left' }, { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' }, { value: 'full', label: 'Full' },
              { value: 'none', label: 'None' },
            ]} onChange={(v) => updateVisual({ sectionAccent: v as VisualSettings['sectionAccent'] })} />
          <OptionGrid label="Divider Style" value={visual.dividerStyle}
            options={[
              { value: 'line', label: 'Line' }, { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' }, { value: 'fade', label: 'Fade' },
              { value: 'none', label: 'None' },
            ]} onChange={(v) => updateVisual({ dividerStyle: v as VisualSettings['dividerStyle'] })} />
        </Section>

        {/* Cards & Surfaces */}
        <Section id="cards" title="Cards & Surfaces" expanded={expandedSections.has('cards')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}>
          <OptionGrid label="Card Style" value={visual.cardStyle} columns={3}
            options={[
              { value: 'flat', label: 'Flat' }, { value: 'elevated', label: 'Elevated' },
              { value: 'outlined', label: 'Outlined' }, { value: 'glass', label: 'Glass' },
              { value: 'gradient', label: 'Gradient' }, { value: 'neumorphic', label: 'Neumorphic' },
            ]} onChange={(v) => updateVisual({ cardStyle: v as VisualSettings['cardStyle'] })} />
          <OptionGrid label="Shadow Intensity" value={visual.shadowIntensity}
            options={[
              { value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' },
              { value: 'medium', label: 'Medium' }, { value: 'dramatic', label: 'Drama' },
              { value: 'colored', label: 'Colored' },
            ]} onChange={(v) => updateVisual({ shadowIntensity: v as VisualSettings['shadowIntensity'] })} />
          <SliderSetting label="Surface Blur" value={visual.surfaceBlur} min={0} max={20} onChange={(v) => updateVisual({ surfaceBlur: v })} suffix="px" />
        </Section>

        {/* Animations */}
        <Section id="animations" title="Animations & Transitions" expanded={expandedSections.has('animations')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
          <OptionGrid label="Animation Speed" value={visual.animationSpeed}
            options={[
              { value: 'none', label: 'None' }, { value: 'slow', label: 'Slow' },
              { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' },
              { value: 'instant', label: 'Instant' },
            ]} onChange={(v) => updateVisual({ animationSpeed: v as VisualSettings['animationSpeed'] })} />
          <OptionGrid label="Transition Curve" value={visual.transitionStyle} columns={3}
            options={[
              { value: 'linear', label: 'Linear' }, { value: 'ease', label: 'Ease' },
              { value: 'ease-in', label: 'Ease In' }, { value: 'ease-out', label: 'Ease Out' },
              { value: 'bounce', label: 'Bounce' }, { value: 'spring', label: 'Spring' },
            ]} onChange={(v) => updateVisual({ transitionStyle: v as VisualSettings['transitionStyle'] })} />
          <OptionGrid label="Hover Effect" value={visual.hoverEffect} columns={3}
            options={[
              { value: 'none', label: 'None' }, { value: 'lift', label: 'Lift' },
              { value: 'glow', label: 'Glow' }, { value: 'scale', label: 'Scale' },
              { value: 'darken', label: 'Darken' }, { value: 'border', label: 'Border' },
            ]} onChange={(v) => updateVisual({ hoverEffect: v as VisualSettings['hoverEffect'] })} />
          <OptionGrid label="Click Effect" value={visual.clickEffect} columns={4}
            options={[
              { value: 'none', label: 'None' }, { value: 'ripple', label: 'Ripple' },
              { value: 'shrink', label: 'Shrink' }, { value: 'flash', label: 'Flash' },
            ]} onChange={(v) => updateVisual({ clickEffect: v as VisualSettings['clickEffect'] })} />
        </Section>

        {/* Header */}
        <Section id="header" title="Header & Toolbar" expanded={expandedSections.has('header')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}>
          <OptionGrid label="Header Style" value={visual.headerStyle}
            options={[
              { value: 'solid', label: 'Solid' }, { value: 'gradient', label: 'Gradient' },
              { value: 'dark', label: 'Dark' }, { value: 'transparent', label: 'Clear' },
              { value: 'glass', label: 'Glass' },
            ]} onChange={(v) => updateVisual({ headerStyle: v as VisualSettings['headerStyle'] })} />
          <OptionGrid label="Header Height" value={visual.headerHeight}
            options={[
              { value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' },
              { value: 'tall', label: 'Tall' },
            ]} onChange={(v) => updateVisual({ headerHeight: v as VisualSettings['headerHeight'] })} />
        </Section>

        {/* Buttons */}
        <Section id="buttons" title="Buttons" expanded={expandedSections.has('buttons')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}>
          <OptionGrid label="Button Style" value={visual.buttonStyle} columns={3}
            options={[
              { value: 'default', label: 'Default' }, { value: 'pill', label: 'Pill' },
              { value: 'square', label: 'Square' }, { value: 'ghost', label: 'Ghost' },
              { value: 'outline', label: 'Outline' }, { value: '3d', label: '3D' },
            ]} onChange={(v) => updateVisual({ buttonStyle: v as VisualSettings['buttonStyle'] })} />
          <OptionGrid label="Button Size" value={visual.buttonSize}
            options={[
              { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]} onChange={(v) => updateVisual({ buttonSize: v as VisualSettings['buttonSize'] })} />
        </Section>

        {/* Spacing */}
        <Section id="spacing" title="Spacing & Layout" expanded={expandedSections.has('spacing')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}>
          <OptionGrid label="Spacing Scale" value={visual.spacingScale} columns={4}
            options={[
              { value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Relaxed' }, { value: 'spacious', label: 'Spacious' },
            ]} onChange={(v) => updateVisual({ spacingScale: v as VisualSettings['spacingScale'] })} />
          <OptionGrid label="Content Width" value={visual.contentWidth} columns={4}
            options={[
              { value: 'narrow', label: 'Narrow' }, { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Wide' }, { value: 'full', label: 'Full' },
            ]} onChange={(v) => updateVisual({ contentWidth: v as VisualSettings['contentWidth'] })} />
          <OptionGrid label="List Gap" value={visual.listGap} columns={4}
            options={[
              { value: 'none', label: 'None' }, { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' },
            ]} onChange={(v) => updateVisual({ listGap: v as VisualSettings['listGap'] })} />
        </Section>

        {/* Effects */}
        <Section id="effects" title="Visual Effects" expanded={expandedSections.has('effects')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}>
          <ToggleSetting label="Glass Effect" description="Frosted glass on surfaces" value={visual.glassEffect} onChange={(v) => updateVisual({ glassEffect: v })} />
          <ToggleSetting label="Gradient Text" description="Color gradients on headings" value={visual.gradientText} onChange={(v) => updateVisual({ gradientText: v })} />
          <ToggleSetting label="Colored Shadows" description="Shadows match primary color" value={visual.coloredShadows} onChange={(v) => updateVisual({ coloredShadows: v })} />
          <ToggleSetting label="Animated Background" description="Subtle moving background" value={visual.animatedBackground} onChange={(v) => updateVisual({ animatedBackground: v })} />
          <ToggleSetting label="Striped Lists" description="Alternate row colors" value={visual.stripedLists} onChange={(v) => updateVisual({ stripedLists: v })} />
          <ToggleSetting label="Rounded Avatars" description="Round inspector icons" value={visual.roundedAvatars} onChange={(v) => updateVisual({ roundedAvatars: v })} />
        </Section>

        {/* Navigation */}
        <Section id="navigation" title="Navigation" expanded={expandedSections.has('navigation')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}>
          <OptionGrid label="Nav Style" value={visual.navStyle}
            options={[
              { value: 'default', label: 'Default' }, { value: 'minimal', label: 'Minimal' },
              { value: 'colorful', label: 'Colorful' }, { value: 'floating', label: 'Floating' },
              { value: 'pills', label: 'Pills' },
            ]} onChange={(v) => updateVisual({ navStyle: v as VisualSettings['navStyle'] })} />
          <OptionGrid label="Nav Position" value={visual.navPosition} columns={2}
            options={[
              { value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' },
            ]} onChange={(v) => updateVisual({ navPosition: v as VisualSettings['navPosition'] })} />
          <OptionGrid label="Icon Size" value={visual.navIconSize}
            options={[
              { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]} onChange={(v) => updateVisual({ navIconSize: v as VisualSettings['navIconSize'] })} />
          <OptionGrid label="Icon Weight" value={visual.iconWeight}
            options={[
              { value: 'thin', label: 'Thin' }, { value: 'normal', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
            ]} onChange={(v) => updateVisual({ iconWeight: v as VisualSettings['iconWeight'] })} />
        </Section>

        {/* Lists & Inputs */}
        <Section id="inputs" title="Inputs & Controls" expanded={expandedSections.has('inputs')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}>
          <OptionGrid label="Input Style" value={visual.inputStyle}
            options={[
              { value: 'default', label: 'Default' }, { value: 'underlined', label: 'Underline' },
              { value: 'filled', label: 'Filled' }, { value: 'rounded', label: 'Rounded' },
              { value: 'minimal', label: 'Minimal' },
            ]} onChange={(v) => updateVisual({ inputStyle: v as VisualSettings['inputStyle'] })} />
          <OptionGrid label="List Style" value={visual.listStyle}
            options={[
              { value: 'default', label: 'Default' }, { value: 'cards', label: 'Cards' },
              { value: 'minimal', label: 'Minimal' }, { value: 'bordered', label: 'Bordered' },
              { value: 'zebra', label: 'Zebra' },
            ]} onChange={(v) => updateVisual({ listStyle: v as VisualSettings['listStyle'] })} />
          <OptionGrid label="Badge Style" value={visual.badgeStyle}
            options={[
              { value: 'default', label: 'Default' }, { value: 'pill', label: 'Pill' },
              { value: 'square', label: 'Square' }, { value: 'dot', label: 'Dot' },
              { value: 'outline', label: 'Outline' },
            ]} onChange={(v) => updateVisual({ badgeStyle: v as VisualSettings['badgeStyle'] })} />
        </Section>

        {/* Modals */}
        <Section id="modals" title="Modals & Overlays" expanded={expandedSections.has('modals')} onToggle={toggleSection}
          icon={<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}>
          <OptionGrid label="Backdrop Style" value={visual.modalBackdrop} columns={4}
            options={[
              { value: 'dark', label: 'Dark' }, { value: 'blur', label: 'Blur' },
              { value: 'light', label: 'Light' }, { value: 'colored', label: 'Colored' },
            ]} onChange={(v) => updateVisual({ modalBackdrop: v as VisualSettings['modalBackdrop'] })} />
          <OptionGrid label="Modal Animation" value={visual.modalAnimation} columns={4}
            options={[
              { value: 'fade', label: 'Fade' }, { value: 'slide-up', label: 'Slide Up' },
              { value: 'scale', label: 'Scale' }, { value: 'none', label: 'None' },
            ]} onChange={(v) => updateVisual({ modalAnimation: v as VisualSettings['modalAnimation'] })} />
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
                backgroundColor: `hsl(${visual.primaryHue}, ${visual.saturation}%, ${visual.brightness}%)`,
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
