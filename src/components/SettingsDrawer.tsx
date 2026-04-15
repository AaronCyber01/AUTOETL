import React from 'react';
import { X, Settings2 } from 'lucide-react';
import { Button } from './ui/button';

export interface AppSettings {
  enableMonitor: boolean;
  enableVisualizer: boolean;
  enableExplainMode: boolean;
  enableConfidence: boolean;
  enableHistory: boolean;
}

export function SettingsDrawer({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: AppSettings; 
  onSettingsChange: (s: AppSettings) => void;
}) {
  if (!isOpen) return null;

  const toggle = (key: keyof AppSettings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-80 bg-[#141414] shadow-2xl z-50 flex flex-col border-l border-[#222222] transform transition-transform">
        <div className="p-4 border-b border-[#222222] flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2 text-white">
            <Settings2 className="w-4 h-4 text-[#E8572A]" />
            Pipeline Settings
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#AAAAAA] hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <SettingToggle 
            title="Self-Healing Monitor Agent" 
            description="Runs after execution to detect anomalies and auto-correct if health score < 60."
            checked={settings.enableMonitor}
            onChange={() => toggle('enableMonitor')}
          />
          <SettingToggle 
            title="Visualizer Agent" 
            description="Automatically generates charts based on the output data schema."
            checked={settings.enableVisualizer}
            onChange={() => toggle('enableVisualizer')}
          />
          <SettingToggle 
            title="Explain & Replay Mode" 
            description="Shows annotated code and allows step-by-step execution replay."
            checked={settings.enableExplainMode}
            onChange={() => toggle('enableExplainMode')}
          />
          <SettingToggle 
            title="Confidence Scoring" 
            description="Displays AI confidence levels for each agent's output."
            checked={settings.enableConfidence}
            onChange={() => toggle('enableConfidence')}
          />
          <SettingToggle 
            title="Pipeline History" 
            description="Saves successful runs to local storage for later replay."
            checked={settings.enableHistory}
            onChange={() => toggle('enableHistory')}
          />
        </div>
      </div>
    </>
  );
}

function SettingToggle({ title, description, checked, onChange }: { title: string, description: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[13px] font-medium text-white">{title}</h3>
        <p className="text-[12px] text-[#888888] mt-1 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:ring-offset-2 focus:ring-offset-[#141414] transition-colors ${checked ? 'bg-gradient-to-r from-[#E8572A] to-[#F4A261]' : 'bg-[#222222]'}`}
      >
        <span className="sr-only">Use setting</span>
        <span aria-hidden="true" className={`pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
