import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# find return (
idx = content.find('  return (')
if idx != -1:
    header = content[:idx]
else:
    print("Could not find 'return ('")
    exit(1)

new_return = '''  const stepOrder = ['idle', 'profiling', 'planning', 'coding', 'qa', 'executing', 'monitoring', 'visualizing', 'done', 'error'];
  const pipelineProgress = Math.max(0, stepOrder.indexOf(currentStep)) / (stepOrder.length - 1) * 100;

  return (
    <div className="h-screen w-screen bg-glass-app flex font-sans text-white overflow-hidden p-6 gap-6">
      {/* Sidebar - Re-styled glass card format */}
      <nav className="w-20 glass-card flex flex-col items-center py-6 gap-5 z-10 shrink-0">
        <button className={`glass-button w-[3.25rem] h-[3.25rem] flex items-center justify-center ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home className="w-5 h-5 stroke-[1.5]" />
        </button>
        <button className={`glass-button w-[3.25rem] h-[3.25rem] flex items-center justify-center ${activeTab === 'input' ? 'active' : ''}`} onClick={() => setActiveTab('input')}>
          <Search className="w-5 h-5 stroke-[1.5]" />
        </button>
        <button className={`glass-button w-[3.25rem] h-[3.25rem] flex items-center justify-center ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
          <Shield className="w-5 h-5 stroke-[1.5]" />
        </button>
        <button className={`glass-button w-[3.25rem] h-[3.25rem] flex items-center justify-center ${activeTab === 'visualizations' ? 'active' : ''}`} onClick={() => setActiveTab('visualizations')}>
          <MapPin className="w-5 h-5 stroke-[1.5]" />
        </button>
        <button className={`glass-button w-[3.25rem] h-[3.25rem] flex items-center justify-center ${settingsOpen ? 'active' : ''}`} onClick={() => setSettingsOpen(true)}>
          <Settings className="w-5 h-5 stroke-[1.5]" />
        </button>
        <div className="mt-auto">
          <button className="glass-button w-[3.25rem] h-[3.25rem] flex items-center justify-center">
            <User className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col h-full z-10 overflow-hidden relative">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-6 pl-4 pr-2 shrink-0">
          <div>
            <h1 className="text-[1.8rem] font-medium tracking-wide opacity-95">Good Morning, Data Architect</h1>
          </div>
          <div className="flex items-center gap-4 opacity-80 font-light tracking-wide text-[15px]">
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <button className="glass-button w-12 h-12 flex items-center justify-center">
               <Database className="w-5 h-5 stroke-[1.5]" />
            </button>
            <button className="glass-button w-12 h-12 flex items-center justify-center relative">
               <ShieldAlert className="w-5 h-5 stroke-[1.5]" />
               {(errorMsg || (monitorResult && monitorResult.healthScore < 80)) && (
                 <span className="absolute top-3 right-3 w-2 h-2 bg-red-400 rounded-full"></span>
               )}
            </button>
          </div>
        </header>

        {activeTab === 'home' && (
          <div className="flex-1 grid grid-cols-12 grid-rows-[auto_auto_auto] gap-6 min-h-0 overflow-y-auto pb-4 custom-scrollbar pr-2">
            
            {/* ROW 0: Agent Process State (Moved here based on user request) */}
            <div className="col-span-12 row-span-1 glass-card px-8 py-6 flex flex-col relative overflow-hidden shrink-0">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide">Agent Process State</h2>
                 <div className="text-[0.75rem] opacity-60 font-light bg-black/20 px-3 py-1 rounded-full border border-white/5">
                   Overall Confidence: {coderResult ? Math.floor(coderResult.confidence) : '-'}%
                 </div>
               </div>
               
               <div className="flex-1 flex items-center justify-between text-[0.85rem] font-medium tracking-wide relative pt-2 pb-2">
                  {/* Background Progress Bar connecting steps */}
                  <div className="absolute left-[2rem] right-[2rem] top-[1.5rem] h-[3px] bg-white/5 z-0">
                     <div className="h-full bg-[var(--color-brand-accent)]/80 transition-all duration-700 ease-out" style={{ width: `${pipelineProgress}%` }}></div>
                  </div>
                  
                  {['idle', 'profiling', 'planning', 'coding', 'qa', 'executing', 'monitoring', 'visualizing', 'done'].map((step, idx) => {
                     const isActive = currentStep === step;
                     const stepIndexForProgress = stepOrder.indexOf(step);
                     const currentStepIndex = stepOrder.indexOf(currentStep);
                     const isComplete = currentStepIndex > stepIndexForProgress || currentStep === 'done';
                     return (
                       <div key={step} className="flex flex-col items-center relative z-10 shrink-0 w-16">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${isActive ? 'bg-[var(--color-brand-accent)] text-white shadow-[0_0_15px_rgba(169,132,103,0.6)] scale-110' : isComplete ? 'bg-[#3b413e] text-white/90 border border-[var(--color-brand-accent)]/30' : 'bg-black/30 text-white/30 border border-white/5'}`}>
                             {isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : (isComplete ? <CheckCircle2 className="w-5 h-5 text-[var(--color-brand-accent)]" /> : <div className="text-sm">{idx}</div>)}
                          </div>
                          <span className={`uppercase text-[0.6rem] tracking-widest ${isActive ? 'opacity-100 text-[var(--color-brand-accent)] font-bold' : isComplete ? 'opacity-80' : 'opacity-40'}`}>{step}</span>
                       </div>
                     )
                  })}
               </div>
            </div>

            {/* ROW 1: CCTV Camera (Main Input) | Weather (Dataset profile) */}
            <div className="col-span-12 xl:col-span-7 row-span-1 glass-card p-6 flex flex-col relative min-h-[300px]">
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide flex items-center gap-3">
                     Workspace Hub
                   </h2>
                   <div className="glass-pill bg-white text-[#333] px-3 py-1.5 text-[0.8rem] font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                      Live
                   </div>
                </div>
                <div className="flex-1 flex gap-4 h-full relative">
                  <div className="flex-1 glass-input rounded-[1.2rem] p-5 flex flex-col border border-white/10 bg-black/5 shadow-inner">
                     <Textarea 
                          placeholder="What would you like AutoETL to do with your data?"
                          className="flex-1 resize-none bg-transparent border-none text-white focus-visible:ring-0 px-0 h-full placeholder:text-white/40 font-light text-[1.1rem] leading-relaxed"
                          value={userRequest}
                          onChange={(e) => setUserRequest(e.target.value)}
                          disabled={isProfilingDataset}
                      />
                  </div>
                  <div className="absolute bottom-6 right-5 flex gap-3">
                     <Button 
                          className="glass-pill px-6 h-10 border-white/20 border font-medium text-white transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white/10"
                          onClick={() => fileInputRef.current?.click()}
                      >
                         <Upload className="w-4 h-4 mr-2" /> 
                         {csvData ? "Change Source" : "Upload source"}
                     </Button>
                     <input type="file" accept=".csv,.xlsx,.xls,.json,.txt,.tsv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                     
                     <Button 
                          className="glass-pill-accent px-6 h-10 border-none transition-all shadow-[0_4px_12px_rgba(169,132,103,0.3)] hover:brightness-110"
                          onClick={() => runPipeline()}
                          disabled={!csvData || !userRequest || isProcessing || isProfilingDataset}
                      >
                         {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                     </Button>
                  </div>
                </div>
            </div>

            {/* Weather / Format Widget */}
            <div className="col-span-12 md:col-span-6 xl:col-span-3 row-span-1 glass-card p-6 flex flex-col relative justify-between min-h-[300px]">
                <div>
                  <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide mb-1">Source Format</h2>
                  <p className="opacity-60 text-[0.95rem] font-light">
                    {dataFormat ? `Parsed as ${dataFormat.toUpperCase()}` : "Not loaded"}
                  </p>
                </div>
                <div>
	                <div className="flex items-center gap-4 mt-6">
	                   <div className="text-white text-[3rem] font-light tracking-tight leading-none">
	                     {datasetProfile ? datasetProfile.rowsCount?.toLocaleString() || "..." : "-"} 
                       <span className="text-2xl font-light opacity-50 ml-2">rows</span>
	                   </div>
	                </div>
                  <p className="opacity-70 text-[1rem] font-light mt-2 mb-2">
	                   {datasetProfile ? `${datasetProfile.columnsCount || 0} features present` : "Awaiting data"}
	                </p>
                </div>
            </div>

            <div className="col-span-12 md:col-span-6 xl:col-span-2 row-span-1 glass-card p-6 flex flex-col relative justify-between min-h-[300px]">
                <div>
                  <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide mb-1">Status</h2>
                  <p className="opacity-60 text-[0.95rem] font-light">
                    {datasetProfile ? 'Ready' : 'Pending'}
                  </p>
                </div>
                {dataFormat && (
                  <div className="glass-pill-accent px-4 py-2 text-center text-[0.9rem] w-full font-medium shadow-md">
                     {datasetProfile ? `Size: ~${datasetProfile.memoryUsageMB?.toFixed(2)} MB` : "Ready"}
                  </div>
                )}
            </div>

            {/* ROW 2: Lighting Control | Climate | Music */}
            <div className="col-span-12 md:col-span-4 xl:col-span-4 row-span-1 glass-card p-6 flex flex-col relative min-h-[280px]">
               <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide mb-8">Agent Control</h2>
               <div className="flex flex-col gap-6 flex-1 justify-center">
                 <div className="flex items-center justify-between">
                    <span className="opacity-90 font-light text-[1.05rem]">Smart Monitor</span>
                    <div className={`w-[3.25rem] h-[1.75rem] rounded-full p-1 cursor-pointer transition-colors shadow-inner ${settings.enableMonitor ? 'bg-[var(--color-brand-accent)]' : 'bg-black/20'}`} onClick={() => setSettings({ ...settings, enableMonitor: !settings.enableMonitor })}>
                      <div className={`w-[1.25rem] h-[1.25rem] bg-white rounded-full transition-transform shadow-sm ${settings.enableMonitor ? 'translate-x-6' : ''}`}></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="opacity-90 font-light text-[1.05rem]">Visualizer Node</span>
                    <div className={`w-[3.25rem] h-[1.75rem] rounded-full p-1 cursor-pointer transition-colors shadow-inner ${settings.enableVisualizer ? 'bg-[var(--color-brand-accent)]' : 'bg-black/20'}`} onClick={() => setSettings({ ...settings, enableVisualizer: !settings.enableVisualizer })}>
                      <div className={`w-[1.25rem] h-[1.25rem] bg-white rounded-full transition-transform shadow-sm ${settings.enableVisualizer ? 'translate-x-6' : ''}`}></div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Climate Widget */}
            <div className="col-span-12 md:col-span-4 xl:col-span-3 row-span-1 glass-card p-6 flex flex-col relative min-h-[280px]">
               <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide mb-4">Pipeline Health</h2>
               <div className="flex flex-col flex-1 pb-2 justify-center">
                 <div className="flex items-end gap-2 mb-2">
                    <span className="text-[3.5rem] font-light tracking-tight leading-none">{monitorResult ? monitorResult.healthScore : "-"}</span>
                    <span className="text-[1.1rem] opacity-50 mb-2">/100</span>
                 </div>
                 <div className="flex justify-between items-center text-[0.95rem] opacity-70 font-light mt-auto w-full pt-4 border-t border-white/10">
                    <span>Target Target</span>
                    <span>{settings.enableMonitor ? 'Auto' : 'Off'}</span>
                 </div>
               </div>
            </div>

            {/* Now Playing Widget */}
            <div className="col-span-12 xl:col-span-5 row-span-1 glass-card p-6 flex flex-col relative min-h-[280px]">
               <h2 className="text-[1.1rem] font-medium opacity-90 tracking-wide mb-4">Visualizer Studio</h2>
               <div className="flex-1 bg-black/20 rounded-[1.2rem] overflow-hidden relative flex items-center justify-center shadow-inner border border-white/5">
                 {visualizerResult && visualizerResult.charts[0] ? (
                    <div className="absolute inset-0 p-2 scale-[0.8] pointer-events-none opacity-90 mix-blend-screen overflow-hidden">
                       <ChartViewer chartConfig={visualizerResult.charts[0]} />
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <BarChart3 className="w-10 h-10 mb-2" />
                      <span className="text-[0.85rem]">No visual output</span>
                    </div>
                 )}
               </div>
               <div className="mt-5 flex flex-col">
                 <div className="text-[1rem] font-medium tracking-wide opacity-90 mb-1 line-clamp-1">{visualizerResult?.charts?.[0]?.description || "Waiting for task..."}</div>
                 <div className="text-[0.85rem] font-light opacity-60 flex justify-between items-center w-full">
                    <span>Model: Gemini</span>
                 </div>
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
'''

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(header + new_return)
