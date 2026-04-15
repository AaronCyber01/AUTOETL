import React from 'react';
import { History, Download, Play, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export interface PipelineRun {
  id: string;
  timestamp: number;
  userRequest: string;
  healthScore?: number;
  plan: any;
  code: string;
}

export function HistorySidebar({ 
  runs, 
  onReplay, 
  onExport,
  onClear
}: { 
  runs: PipelineRun[]; 
  onReplay: (run: PipelineRun) => void; 
  onExport: () => void; 
  onClear: () => void;
}) {
  return (
    <div className="glass-card shadow-2xl h-full flex flex-col overflow-hidden bg-white/70 border border-[#8e5e41]/20 backdrop-blur-3xl animate-in slide-in-from-left-4 duration-300">
      <div className="p-4 border-b border-[#8e5e41]/20 flex justify-between items-center bg-white/40">
        <h2 className="font-semibold flex items-center gap-2 text-[14px] text-[#4a3d31]">
          <History className="w-4 h-4 text-[#8e5e41]" />
          Run History
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onExport} title="Export History" className="text-[#8e5e41] hover:text-[#4a3d31] hover:bg-[#8e5e41]/10">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} title="Clear History" className="text-[#8e5e41] hover:text-red-600 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-[#8e5e41]/50 h-32">
             <History className="w-8 h-8 mb-2 opacity-50" />
             <p className="text-[12px] text-center">No pipeline executions yet.</p>
          </div>
        ) : (
          runs.map(run => (
            <div key={run.id} className="p-4 glass-list rounded-xl border border-[#8e5e41]/10 hover:border-[#8e5e41]/40 transition-all group shadow-sm bg-white/50 cursor-default">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-medium text-[#8e5e41]/70 tracking-wide uppercase">
                  {new Date(run.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                {run.healthScore !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${run.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : run.healthScore >= 60 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                    {run.healthScore}
                  </span>
                )}
              </div>
              <p className="text-[14px] font-medium text-[#4a3d31] line-clamp-2 mb-3 leading-snug" title={run.userRequest}>
                "{run.userRequest}"
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[13px] h-9 border-[#8e5e41]/30 text-[#8e5e41] hover:bg-[#8e5e41] hover:text-white hover:border-[#8e5e41] transition-all font-semibold rounded-lg shadow-sm group-hover:opacity-100 opacity-60"
                onClick={() => onReplay(run)}
              >
                <Play className="w-3 h-3 mr-2 fill-current" /> Load Run
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
