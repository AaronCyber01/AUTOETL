const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');

// 1. Remove Sidebar Import
content = content.replace(
  "import { Sidebar, AgentPhase } from './components/dashboard/Sidebar';",
  "type AgentPhase = 'profiler' | 'planner' | 'coder' | 'visualizer' | 'history' | 'qa' | 'monitor';"
);

// 2. Replace the main JSX return block
const startTag = '  return (';
const mainBlockStart = content.indexOf(startTag);

if (mainBlockStart !== -1) {
  const replacement = `  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen relative overflow-hidden" data-mode="connect">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-neutral-950/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex justify-between items-center px-6 h-16">
        <div className="flex items-center flex-none mr-12">
          <h1 className="text-2xl font-bold tracking-tighter text-white uppercase font-headline">Synthetic Frontier</h1>
        </div>
        <nav className="hidden md:flex items-center relative gap-8">
           <button onClick={() => setActiveAgentView('profiler')} className={\`font-headline tracking-tight transition-colors duration-300 \${activeAgentView === 'profiler' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}\`}>PROFILER</button>
           <button onClick={() => setActiveAgentView('planner')} className={\`font-headline tracking-tight transition-colors duration-300 \${activeAgentView === 'planner' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}\`}>PLANNER</button>
           <button onClick={() => setActiveAgentView('coder')} className={\`font-headline tracking-tight transition-colors duration-300 \${activeAgentView === 'coder' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}\`}>CODER</button>
           <button onClick={() => setActiveAgentView('qa')} className={\`font-headline tracking-tight transition-colors duration-300 \${activeAgentView === 'qa' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}\`}>QUALITY ASSURANCE</button>
           <button onClick={() => setActiveAgentView('monitor')} className={\`font-headline tracking-tight transition-colors duration-300 \${activeAgentView === 'monitor' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}\`}>MONITOR</button>
           <button onClick={() => setActiveAgentView('visualizer')} className={\`font-headline tracking-tight transition-colors duration-300 \${activeAgentView === 'visualizer' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}\`}>VISUALIZER</button>
        </nav>
        <div className="flex items-center gap-4">
           <button className="text-neutral-400 hover:text-white" onClick={() => setSettingsOpen(true)}>
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="pt-16 min-h-screen technical-grid relative h-full flex flex-col overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
          
          {/* Pipeline Visualizer */}
          <section className="glass-panel rounded-xl relative overflow-hidden group p-6 pb-4 shrink-0 mb-8 border border-white/10">
             <div className="flex justify-between items-start mb-8">
                <div>
                   <span className="text-[10px] font-label uppercase tracking-widest text-secondary mb-1 block">Active Workflow</span>
                   <h2 className="text-3xl font-headline font-bold text-white tracking-tighter uppercase">Agent Pipeline</h2>
                </div>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-bold text-secondary flex items-center gap-1">
                      <span className={\`w-1.5 h-1.5 rounded-full \${isProcessing ? 'bg-secondary animate-pulse' : 'bg-green-500'}\`}></span> 
                      {isProcessing ? 'PROCESSING' : 'NOMINAL'}
                   </span>
                </div>
             </div>
             
             {/* Node Pipeline Visualization */}
             <div className="relative flex items-center justify-between px-12 py-4">
                <div className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-white/10 -translate-y-1/2">
                    <div className="h-full bg-secondary glow-path transition-all duration-500" 
                         style={{width: currentStep === 'idle' ? '0%' : currentStep === 'profiling' ? '16%' : currentStep === 'planning' ? '33%' : currentStep === 'coding' ? '50%' : currentStep === 'qa' ? '66%' : currentStep === 'executing' ? '83%' : '100%'}}></div>
                </div>
                
                {/* Node: Profiler */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={\`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 \${['profiling', 'planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}\`}>
                      <Database className={\`w-8 h-8 \${['profiling', 'planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}\`} />
                   </div>
                   <span className={\`text-[10px] font-label uppercase tracking-widest font-bold \${['profiling', 'planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}\`}>Profiler</span>
                </div>

                {/* Node: Planner */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={\`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 \${['planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}\`}>
                      <TerminalSquare className={\`w-8 h-8 \${['planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}\`} />
                   </div>
                   <span className={\`text-[10px] font-label uppercase tracking-widest font-bold \${['planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}\`}>Planner</span>
                </div>

                {/* Node: Coder */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={\`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 \${['coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}\`}>
                      <FileCode2 className={\`w-8 h-8 \${['coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}\`} />
                   </div>
                   <span className={\`text-[10px] font-label uppercase tracking-widest font-bold \${['coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}\`}>Coder</span>
                </div>

                {/* Node: Quality Assurance */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={\`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 \${['qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}\`}>
                      <CheckCircle2 className={\`w-8 h-8 \${['qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}\`} />
                   </div>
                   <span className={\`text-[10px] font-label uppercase tracking-widest font-bold text-center \${['qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}\`}>Quality<br/>Assurance</span>
                </div>

                {/* Node: Monitor */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={\`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 \${['executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}\`}>
                      <Activity className={\`w-8 h-8 \${['executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}\`} />
                   </div>
                   <span className={\`text-[10px] font-label uppercase tracking-widest font-bold \${['executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}\`}>Monitor</span>
                </div>

                {/* Node: Visualizer */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={\`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 \${['done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}\`}>
                      <BarChart3 className={\`w-8 h-8 \${['done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}\`} />
                   </div>
                   <span className={\`text-[10px] font-label uppercase tracking-widest font-bold \${['done'].includes(currentStep) ? 'text-secondary' : 'text-white'}\`}>Visualizer</span>
                </div>
             </div>
          </section>

          {/* Core Functional Grid */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-0 overflow-hidden mb-6">
             {/* LEFT COLUMN */}
             <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-y-auto custom-scrollbar">
                
                {/* Upload Section */}
                <div 
                   className={cn(
                     "border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer mb-6 shrink-0",
                     "hover:bg-white/5 hover:border-primary/50",
                     csvData && "bg-white/5 border-primary/30"
                   )}
                   onClick={() => document.getElementById('file-upload')?.click()}
                >
                   <input type="file" id="file-upload" className="hidden" accept=".csv,.json,.txt,.xlsx,.xls" onChange={handleFileUpload} />
                   <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 neon-orange-shadow">
                     <Upload className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(255,144,100,0.8)]" />
                   </div>
                   <h3 className="font-headline font-semibold text-lg text-white mb-2">
                     {csvData ? "Dataset Ready for Processing" : "Initialize Data Ingestion"}
                   </h3>
                   <p className="text-on-surface-variant text-sm max-w-md">
                     {csvData ? \`Loaded \${csvPreview.length} rows from source.\` : "Upload CSV, JSON, TXT, or Excel files to begin the continuous ETL pipeline."}
                   </p>
                </div>

                {/* Data Profiler Embedded */}
                {csvData && datasetProfile && (
                   <div className="mb-6 shrink-0">
                      <DataProfiler profile={datasetProfile} isGenerating={isProfilingDataset} />
                   </div>
                )}

                {/* Prompt Section */}
                <div className="shrink-0 flex flex-col gap-3">
                   <label className="text-[10px] font-label text-secondary uppercase tracking-widest">Pipeline Objective Directive</label>
                   <Textarea 
                      placeholder="E.g., Normalize date formatting, strip null columns, and standardize currency..."
                      className="resize-none bg-surface-container-high border-white/10 text-white min-h-[120px] p-4 text-sm font-mono placeholder:text-on-surface-variant focus-visible:ring-secondary/50 rounded-xl"
                      value={userRequest}
                      onChange={(e) => setUserRequest(e.target.value)}
                      disabled={isProfilingDataset}
                   />
                   <Button 
                      className="bg-primary hover:opacity-80 text-on-primary font-headline font-bold text-lg h-14 rounded-xl mt-2 transition-all neon-orange-shadow"
                      onClick={() => runPipeline()}
                      disabled={!csvData || !userRequest || isProcessing || isProfilingDataset}
                   >
                      {isProcessing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                      {isProcessing ? 'SYSTEM PROCESSING' : 'INITIALIZE PIPELINE'}
                   </Button>
                </div>
             </div>

             {/* RIGHT COLUMN */}
             <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 shrink-0">
                   <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white">Execution Telemetry</h3>
                   {executionResultCsv && (
                     <Button 
                       variant="outline"
                       className="border border-secondary text-secondary hover:bg-secondary/10 bg-transparent font-label text-xs uppercase shadow-[0_0_10px_rgba(0,227,253,0.3)] transition-all"
                       onClick={handleDownloadFinalData}
                     >
                       <Download className="w-4 h-4 mr-2" /> Export
                     </Button>
                   )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                   {!plannerResult && !errorMsg && !executionResultCsv && (
                      <div className="flex-1 flex flex-col justify-center items-center opacity-40 text-center px-4 text-on-surface-variant">
                         <Database className="w-12 h-12 mb-4" />
                         <p className="font-mono text-sm">System standing by. Awaiting pipeline initialization.</p>
                      </div>
                   )}

                   {plannerResult && (
                      <div className="space-y-4 flex flex-col shrink-0 mb-8">
                         <h4 className="text-[10px] font-label text-secondary uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,227,253,0.5)]">Transformations Applied</h4>
                         <div className="bg-surface-container-high p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
                            {plannerResult.steps.map((step, i) => (
                               <div key={i} className="flex gap-3 text-sm text-on-surface leading-relaxed">
                                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-primary drop-shadow-[0_0_5px_rgba(255,144,100,0.8)]" />
                                  <span className="font-body opacity-90">{step.description}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}

                   {executionResultCsv && executionPreview.length > 0 && (
                      <div className="space-y-4 shrink-0">
                         <h4 className="text-[10px] font-label text-secondary uppercase tracking-widest">Transformed Data Matrix</h4>
                         <div className="bg-surface-container-high rounded-xl overflow-hidden border border-white/5">
                            <div className="overflow-x-auto custom-scrollbar">
                               <table className="w-full text-left whitespace-nowrap text-xs text-on-surface font-mono">
                                  <thead>
                                     <tr>
                                        {Object.keys(executionPreview[0] || {}).map(k => (
                                           <th key={k} className="px-4 py-3 bg-surface-container border-b border-white/10 font-label tracking-wider">{k}</th>
                                        ))}
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {executionPreview.map((row, i) => (
                                        <tr key={i} className="border-b last:border-0 border-white/5 hover:bg-white/5 transition-colors">
                                           {Object.values(row).map((v: any, j) => (
                                              <td key={j} className="px-4 py-2">{String(v).substring(0, 30)}</td>
                                           ))}
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* Status Logs Base Terminal */}
          <section className="shrink-0 bg-transparent border border-white/5 rounded-xl p-4 glow-inner">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
               <h3 className="font-label font-bold text-xs tracking-widest uppercase flex items-center gap-2 text-neutral-400">System Logs</h3>
               <span className="text-[10px] font-label text-neutral-500 uppercase tracking-widest">Autoscroll: Active</span>
            </div>
            <div className="space-y-2 font-mono text-[11px] h-28 overflow-y-auto pr-4 scroll-hidden flex flex-col-reverse">
               {currentStep === 'done' && (
                  <div className="flex gap-4 text-neutral-400">
                     <span className="text-secondary">[{new Date().toLocaleTimeString()}]</span>
                     <span className="text-tertiary-container">Pipeline execution complete. Resulting node ready for export.</span>
                  </div>
               )}
               {errorMsg && (
                  <div className="flex gap-4 text-neutral-400">
                     <span className="text-secondary">[{new Date().toLocaleTimeString()}]</span>
                     <span className="text-error font-bold">FATAL ERROR: {errorMsg}</span>
                  </div>
               )}
               {currentStep !== 'idle' && (
                  <div className="flex gap-4 text-neutral-400">
                     <span className="text-secondary">[{new Date().toLocaleTimeString()}]</span>
                     <span className="text-white">Active execution block: [{currentStep.toUpperCase()}]. Awaiting container synchronization...</span>
                  </div>
               )}
               {isProfilingDataset && (
                  <div className="flex gap-4 text-neutral-400">
                     <span className="text-secondary">[{new Date().toLocaleTimeString()}]</span>
                     <span className="text-primary-dim">Running dataset telemetry and dynamic profile inferences...</span>
                  </div>
               )}
               <div className="flex gap-4 text-neutral-400">
                  <span className="text-secondary">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-white">Synthetic Frontier kernel online. Virtual environment loaded correctly.</span>
               </div>
            </div>
          </section>

        </div>
      </main>

      <SettingsDrawer 
         isOpen={settingsOpen} 
         onClose={() => setSettingsOpen(false)} 
         settings={settings} 
         onSettingsChange={setSettings} 
      />
    </div>
  );
}
`;

  content = content.substring(0, mainBlockStart) + replacement;
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log('Successfully updated App.tsx layout');
} else {
  console.log('Could not find start tag');
}
