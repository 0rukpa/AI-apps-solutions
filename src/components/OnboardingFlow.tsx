import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  Users, 
  Calendar, 
  Layout, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  X,
  FileSpreadsheet,
  RefreshCw,
  Palette
} from 'lucide-react';

interface OnboardingFlowProps {
  onClose: () => void;
}

export default function OnboardingFlow({ onClose }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to KaLi",
      tagline: "Your Intentional Growth Companion",
      description: "KaLi is an elegant space crafted for women to reclaim ownership of their time, plan their career paths, and pursue goals with high clarity and support.",
      icon: <Compass className="w-12 h-12 text-kali-rose-500" />,
      visual: (
        <div className="bg-kali-rose-50 border border-kali-rose-100 p-6 rounded-2xl space-y-3 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-kali-rose-500 bg-white px-2.5 py-1 rounded-md border border-kali-rose-100">Core Mission</span>
          </div>
          <p className="text-sm font-serif italic text-gray-800 leading-relaxed">
            "We believe that intentional planning is the foundation of growth. KaLi keeps your aspirations clear and structured, every step of the way."
          </p>
        </div>
      )
    },
    {
      title: "Solo vs. Squad Space",
      tagline: "Flexible Boundaries for Your Goals",
      description: "Choose when to focus in private, and when to seek community power.",
      icon: <Users className="w-12 h-12 text-kali-sage-500" />,
      visual: (
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="bg-white p-4 rounded-xl border border-kali-cream-200 shadow-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-kali-rose-600 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Solo Space
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">Your private dashboard to draft, organize, and manage opportunities confidentially.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-kali-cream-200 shadow-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-kali-sage-600 font-semibold text-xs">
              <Users className="w-3.5 h-3.5" /> Squad Space
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">Collaborative circles where public deadlines are shared, with support and comment boards.</p>
          </div>
        </div>
      )
    },
    {
      title: "Smart Tracking Windows",
      tagline: "Never Miss an Application Opening",
      description: "Draft opportunities in the 'Waiting Room' with future opening dates. KaLi continuously checks dates behind the scenes, moves them to 'Ready to Apply' automatically, and dispatches accountability alerts.",
      icon: <Calendar className="w-12 h-12 text-kali-gold-500" />,
      visual: (
        <div className="bg-kali-cream-100/50 border border-kali-cream-200 p-4 rounded-xl flex items-center justify-between text-left gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">Waiting Room</span>
            <div className="text-xs font-bold text-gray-900 leading-tight">Fellowship App</div>
            <p className="text-[9px] text-gray-500">Opens in 3 days</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <RefreshCw className="w-4 h-4 text-kali-rose-500 animate-spin-slow" />
            <span className="text-[8px] font-mono text-gray-400">Time Sync</span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] font-mono uppercase bg-kali-sage-50 text-kali-sage-700 px-2 py-0.5 rounded border border-kali-sage-200">Ready to Apply</span>
            <div className="text-xs font-bold text-gray-900 leading-tight">Auto-Transitioned</div>
            <p className="text-[9px] text-kali-sage-600 font-medium">Notification sent</p>
          </div>
        </div>
      )
    },
    {
      title: "Templates & Calendar Sync",
      tagline: "Seamless Professional Workflow",
      description: "Apply pre-set templates (Job, Scholarship, Grant) to populate tracking forms instantly, and seamlessly synchronize your deadlines directly with Google Calendar or Outlook Calendar.",
      icon: <Layout className="w-12 h-12 text-kali-rose-500" />,
      visual: (
        <div className="bg-white p-4 rounded-xl border border-kali-cream-200 shadow-xs text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-800">Job Template</span>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-kali-rose-100 text-kali-rose-600 rounded">Selected</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[9px] text-gray-400">
            <div className="bg-kali-cream-50 p-1.5 rounded">Category: Job</div>
            <div className="bg-kali-cream-50 p-1.5 rounded">Status: In Progress</div>
            <div className="bg-kali-cream-50 p-1.5 rounded">Sync: Active</div>
          </div>
        </div>
      )
    },
    {
      title: "Workspace Style & Customization",
      tagline: "Tailor your aesthetic",
      description: "KaLi belongs to you. In your Workspace Settings, you can switch between visual moods like Editorial Cream, Zen Forest, Gilded Velvet, or the stunning new Atmospheric Dream pink theme, plus adjust card shadows and paper grid styles.",
      icon: <Palette className="w-12 h-12 text-kali-rose-500" />,
      visual: (
        <div className="bg-gradient-to-br from-[#FFF0F3] to-[#FFE3EC] p-5 rounded-2xl border border-pink-200 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-800">Atmospheric Dream</span>
            <span className="text-[9px] uppercase font-mono px-2.5 py-0.5 bg-pink-500 text-white rounded font-bold">Active Mood</span>
          </div>
          <p className="text-[10px] text-pink-600 font-medium">Pick the palette, layout lines, and shadows that inspire your best daily planning.</p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('kali_onboarding_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('kali_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-xl border border-kali-cream-200 shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        
        {/* Skip button top right */}
        <button 
          onClick={handleSkip}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          Skip
        </button>

        {/* Progress bar */}
        <div className="w-full h-1 bg-kali-cream-100 flex">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-full transition-all duration-300 ${idx <= currentStep ? 'bg-kali-rose-500' : 'bg-transparent'}`}
              style={{ width: `${100 / steps.length}%` }}
            />
          ))}
        </div>

        {/* Steps container */}
        <div className="p-8 md:p-10 flex-1 flex flex-col justify-between space-y-8 overflow-y-auto">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-center flex-1 flex flex-col justify-center"
            >
              {/* Icon */}
              <div className="mx-auto w-20 h-20 rounded-3xl bg-kali-cream-50 flex items-center justify-center border border-kali-cream-100 shadow-inner">
                {steps[currentStep].icon}
              </div>

              {/* Title & Tagline */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono tracking-widest text-kali-rose-500 font-semibold">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif italic text-gray-900 leading-tight">
                  {steps[currentStep].title}
                </h2>
                <p className="text-xs font-mono uppercase tracking-wider text-kali-rose-500">
                  {steps[currentStep].tagline}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {steps[currentStep].description}
              </p>

              {/* Visual Asset or Simulation */}
              <div className="max-w-md mx-auto w-full pt-4">
                {steps[currentStep].visual}
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-kali-cream-100">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentStep === idx ? 'w-4 bg-kali-rose-500' : 'bg-kali-cream-200'}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-kali-rose-600 hover:bg-kali-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {currentStep === steps.length - 1 ? (
                <>Get Started <CheckCircle className="w-3.5 h-3.5" /></>
              ) : (
                <>Next <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
