import React from 'react';
import { Database, ListChecks, FileCode2, ShieldCheck, Activity, BarChart3, History } from 'lucide-react';

export type AgentPhase = 'profiler' | 'planner' | 'coder' | 'qa' | 'monitor' | 'visualizer' | 'history';

export interface SidebarProps {
  activeAgentView: AgentPhase;
  setActiveAgentView: (phase: AgentPhase) => void;
  currentStep: string;
}

export function Sidebar({ activeAgentView, setActiveAgentView, currentStep }: SidebarProps) {
  return (
    <nav className="w-20 glass-card bg-transparent flex flex-col items-center py-6 gap-4 z-10 shrink-0 border-0 shadow-lg">
      <button 
        className={`glass-button w-11 h-11 flex items-center justify-center transition-all ${activeAgentView === 'profiler' ? 'active bg-[#8e5e41] text-white shadow-md border-0 rounded-[14px]' : 'text-[#8e5e41] border-transparent rounded-full hover:bg-white/40'}`}
        onClick={() => setActiveAgentView('profiler')}
        title="Data Profiler"
      >
        <Database className="w-5 h-5 stroke-[2]" />
      </button>

      <button 
        className={`glass-button w-11 h-11 flex items-center justify-center transition-all ${activeAgentView === 'planner' || activeAgentView === 'coder' ? 'active bg-[#8e5e41] text-white shadow-md border-0 rounded-[14px]' : 'text-[#8e5e41] border-transparent rounded-full hover:bg-white/40'}`}
        onClick={() => setActiveAgentView('planner')}
        title="Execution Plan & Code"
      >
        <ListChecks className="w-5 h-5 stroke-[2]" />
      </button>

      <button 
        className={`glass-button w-11 h-11 flex items-center justify-center transition-all ${activeAgentView === 'qa' ? 'active bg-[#8e5e41] text-white shadow-md border-0 rounded-[14px]' : 'text-[#8e5e41] border-transparent rounded-full hover:bg-white/40'}`}
        onClick={() => setActiveAgentView('qa')}
        title="QA Validation"
      >
        <ShieldCheck className="w-5 h-5 stroke-[2]" />
      </button>

      <button 
        className={`glass-button w-11 h-11 flex items-center justify-center transition-all ${activeAgentView === 'monitor' ? 'active bg-[#8e5e41] text-white shadow-md border-0 rounded-[14px]' : 'text-[#8e5e41] border-transparent rounded-full hover:bg-white/40'}`}
        onClick={() => setActiveAgentView('monitor')}
        title="Monitor Pipeline"
      >
        <Activity className="w-5 h-5 stroke-[2]" />
      </button>

      <button 
        className={`glass-button w-10 h-10 flex items-center justify-center ${activeAgentView === 'visualizer' ? 'active bg-[#8e5e41] text-white shadow-md border-0' : 'text-[#8e5e41] border-transparent'}`}
        onClick={() => setActiveAgentView('visualizer')}
        title="Visualizer"
      >
        <BarChart3 className="w-5 h-5 stroke-[2]" />
      </button>

      <button 
        className={`glass-button w-10 h-10 flex items-center justify-center ${activeAgentView === 'history' ? 'active bg-[#8e5e41] text-white shadow-md border-0' : 'text-[#8e5e41] border-transparent'}`}
        onClick={() => setActiveAgentView('history')}
        title="History"
      >
        <History className="w-5 h-5 stroke-[2]" />
      </button>
    </nav>
  );
}
