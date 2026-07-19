import React from 'react';
import { 
  Sparkles, 
  Check, 
  Palette, 
  Type, 
  Layers, 
  Grid,
  Moon,
  Sun,
  Flame,
  Leaf
} from 'lucide-react';

interface DesignStudioProps {
  uiStyle: string;
  onUiStyleChange: (style: string) => void;
  cardTreatment: string;
  onCardTreatmentChange: (treatment: string) => void;
  bgGridEnabled: boolean;
  onBgGridChange: (enabled: boolean) => void;
}

export default function DesignStudio({
  uiStyle,
  onUiStyleChange,
  cardTreatment,
  onCardTreatmentChange,
  bgGridEnabled,
  onBgGridChange
}: DesignStudioProps) {

  const visualStyles = [
    {
      id: 'cream',
      name: 'Editorial Cream',
      description: 'Clean high-contrast text on soft off-white cream paper layers.',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      colorPreview: 'bg-[#FDF8F5] border-[#E8DED3]'
    },
    {
      id: 'sage',
      name: 'Zen Forest',
      description: 'Organic wellness-centered sage canvas with delicate forest tones.',
      icon: <Leaf className="w-4 h-4 text-emerald-600" />,
      colorPreview: 'bg-[#F4F6F5] border-[#D3E0DA]'
    },
    {
      id: 'velvet',
      name: 'Gilded Velvet',
      description: 'Prestigious velvet dark background with fine champagne outline highlights.',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      colorPreview: 'bg-[#121110] border-[#2D2926]'
    },
    {
      id: 'dream',
      name: 'Atmospheric Dream',
      description: 'Luminous soft pink gradients with a bright, uplifting aesthetic.',
      icon: <Flame className="w-4 h-4 text-kali-rose-500" />,
      colorPreview: 'bg-gradient-to-br from-[#FFF0F5] to-[#FFB6C1] border-[#FF69B4]'
    }
  ];

  const cardTreatments = [
    {
      id: 'classic',
      name: 'Classic Editorial',
      description: 'Thin, precise boundaries and absolute minimal flat structure.',
      previewClass: 'bg-white border border-kali-cream-200 shadow-xs'
    },
    {
      id: 'elevated',
      name: 'Floating Luxe',
      description: 'Soft layered drop shadows and beautifully balanced curved edges.',
      previewClass: 'bg-white border border-kali-cream-100 shadow-lg'
    },
    {
      id: 'brutalist',
      name: 'Stark Modernist',
      description: 'Heavy high-contrast solid borders with zero micro-shadowing.',
      previewClass: 'bg-white border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
    },
    {
      id: 'glass',
      name: 'Frosted Glass',
      description: 'Translucent layers blending cleanly with the underlying background colors.',
      previewClass: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-xs'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs space-y-6 text-left">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-kali-rose-500 font-semibold bg-kali-rose-50 px-2.5 py-1 rounded-md border border-kali-rose-100">Workspace Settings</span>
        <h3 className="font-serif text-xl text-gray-900 mt-2">Workspace & Style Customizer</h3>
        <p className="text-xs text-gray-500 mt-0.5">Customize your personal planning dashboard in real-time below.</p>
      </div>

      {/* 1. Theme / UI Style selector */}
      <div className="space-y-3 pt-4 border-t border-kali-cream-100">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-kali-rose-500" />
          Choose Workspace Mood
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {visualStyles.map(style => (
            <button
              key={style.id}
              onClick={() => onUiStyleChange(style.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                uiStyle === style.id 
                  ? 'border-kali-rose-500 bg-kali-rose-50/15 ring-1 ring-kali-rose-500/20' 
                  : 'border-kali-cream-100 hover:bg-kali-cream-50/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  {style.icon} {style.name}
                </span>
                {uiStyle === style.id ? (
                  <span className="w-4 h-4 rounded-full bg-kali-rose-500 flex items-center justify-center text-white text-[9px]">✓</span>
                ) : (
                  <div className={`w-5 h-3 rounded-full border ${style.colorPreview}`} />
                )}
              </div>
              <p className="text-[10px] text-gray-400 leading-normal mt-1.5">{style.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Card Treatment Options */}
      <div className="space-y-3 pt-4 border-t border-kali-cream-100">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-kali-rose-500" />
          Card Treatment Options
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {cardTreatments.map(t => (
            <button
              key={t.id}
              onClick={() => onCardTreatmentChange(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                cardTreatment === t.id 
                  ? 'border-kali-rose-500 bg-kali-rose-50/15 ring-1 ring-kali-rose-500/20' 
                  : 'border-kali-cream-100 hover:bg-kali-cream-50/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-gray-800">{t.name}</span>
                <div className={`w-8 h-4 rounded ${t.previewClass}`} />
              </div>
              <p className="text-[10px] text-gray-400 leading-normal mt-1.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Grid Planner Background Toggle */}
      <div className="space-y-3 pt-4 border-t border-kali-cream-100 pb-2">
        <div className="flex items-center justify-between p-3.5 bg-kali-cream-50/30 rounded-2xl border border-kali-cream-100">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-kali-rose-500" /> Bullet-Journal Grid
            </span>
            <p className="text-[10px] text-gray-400">Apply a professional dotted planner background texture.</p>
          </div>
          <button
            onClick={() => onBgGridChange(!bgGridEnabled)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              bgGridEnabled 
                ? 'bg-kali-rose-500 border-kali-rose-500 text-white shadow-xs' 
                : 'bg-white border-kali-cream-200 text-gray-600 hover:bg-kali-cream-50'
            }`}
          >
            {bgGridEnabled ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
}
