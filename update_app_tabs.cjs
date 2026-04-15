const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');

// 1. Remove "Synthetic Frontier" heading text
content = content.replace(
  '<h1 className="text-2xl font-bold tracking-tighter text-white uppercase font-headline">Synthetic Frontier</h1>',
  '<h1 className="text-2xl font-bold tracking-tighter text-white uppercase font-headline"></h1>'
);

// 2. Extract Core Functional Grid to replace with conditional tabs
const startMarker = '{/* Core Functional Grid */}';
const endMarker = '{/* Status Logs Base Terminal */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* Core Functional Views */}
          <div className="flex-1 min-h-0 overflow-hidden mb-6 flex flex-col">
             
             {/* PROFILER VIEW */}
             {activeAgentView === 'profiler' && (
                 <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-hidden h-full min-h-0">
                    {/* LEFT COLUMN: Upload & Profiler */}
                    <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-y-auto custom-scrollbar">
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
        
                        {csvData && datasetProfile && (
                           <div className="shrink-0">
                              <DataProfiler profile={datasetProfile} isGenerating={isProfilingDataset} />
                           </div>
                        )}
                    </div>
                    
                    {/* RIGHT COLUMN: Prompt */}
                    <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-y-auto custom-scrollbar justify-center">
                        <div className="shrink-0 flex flex-col gap-3 max-w-xl mx-auto w-full">
                           <label className="text-[10px] font-label text-secondary uppercase tracking-widest text-center mb-2">Pipeline Objective Directive</label>
                           <Textarea 
                              placeholder="E.g., Normalize date formatting, strip null columns, and standardize currency..."
                              className="resize-none bg-surface-container-high border-white/10 text-white min-h-[180px] p-6 text-sm font-mono placeholder:text-on-surface-variant focus-visible:ring-secondary/50 rounded-xl shadow-inner"
                              value={userRequest}
                              onChange={(e) => setUserRequest(e.target.value)}
                              disabled={isProfilingDataset}
                           />
                           <Button 
                              className="bg-primary hover:opacity-80 text-on-primary font-headline font-bold text-lg h-16 rounded-xl mt-4 transition-all neon-orange-shadow shadow-[0_0_20px_rgba(255,144,100,0.4)]"
                              onClick={() => runPipeline()}
                              disabled={!csvData || !userRequest || isProcessing || isProfilingDataset}
                           >
                              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                              {isProcessing ? 'SYSTEM PROCESSING' : 'INITIALIZE PIPELINE'}
                           </Button>
                        </div>
                    </div>
                 </div>
             )}

             {/* PLANNER VIEW */}
             {activeAgentView === 'planner' && (
                <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden h-full">
                    <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white mb-6 pb-4 border-b border-white/10 shrink-0">Strategic ETL Plan</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {plannerResult ? (
                            <div className="space-y-4 max-w-4xl mx-auto mt-4">
                                <h4 className="text-[10px] font-label text-secondary uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,227,253,0.5)]">Transformations Applied</h4>
                                <div className="bg-surface-container-high p-6 rounded-xl border border-white/5 space-y-4 shadow-inner">
                                   {plannerResult.steps.map((step, i) => (
                                      <div key={i} className="flex gap-4 text-sm text-on-surface leading-relaxed p-3 hover:bg-white/5 rounded-lg transition-colors">
                                         <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0 text-primary drop-shadow-[0_0_5px_rgba(255,144,100,0.8)]" />
                                         <span className="font-body opacity-90 text-base">{step.description}</span>
                                      </div>
                                   ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center items-center opacity-40 text-center h-full pt-12">
                               <TerminalSquare className="w-16 h-16 mb-4 text-on-surface-variant drop-shadow-md" />
                               <p className="font-mono text-sm text-on-surface-variant">Awaiting operational directives from Planner agent.</p>
                            </div>
                        )}
                    </div>
                </div>
             )}

             {/* CODER VIEW */}
             {activeAgentView === 'coder' && (
                 <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-hidden h-full min-h-0">
                    {/* LEFT COLUMN: Code Generation */}
                    <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden shadow-inner">
                        <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white mb-6 pb-4 border-b border-white/10 shrink-0 text-secondary">Synthesized Code</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b] rounded-xl border border-white/5 p-4">
                            {coderResult ? (
                                <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap">
                                    <code>{coderResult.code}</code>
                                </pre>
                            ) : (
                                <div className="flex-1 flex flex-col justify-center items-center opacity-40 text-center h-full pt-12">
                                   <FileCode2 className="w-12 h-12 mb-4 text-on-surface-variant" />
                                   <p className="font-mono text-sm text-on-surface-variant">Awaiting code synthesis.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* RIGHT COLUMN: Execution Telemetry */}
                    <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 shrink-0">
                           <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white">Execution Telemetry</h3>
                           {executionResultCsv && (
                             <Button 
                               variant="outline"
                               className="border border-secondary text-secondary hover:bg-secondary/10 bg-transparent font-label text-[10px] uppercase shadow-[0_0_10px_rgba(0,227,253,0.3)] transition-all h-8 py-0"
                               onClick={handleDownloadFinalData}
                             >
                               <Download className="w-3 h-3 mr-2" /> Export Array
                             </Button>
                           )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                           {executionResultCsv && executionPreview.length > 0 ? (
                              <div className="space-y-4 shrink-0 h-full flex flex-col">
                                 <h4 className="text-[10px] font-label text-secondary uppercase tracking-widest">Transformed Data Matrix</h4>
                                 <div className="bg-surface-container-high rounded-xl overflow-hidden border border-white/5 flex-1 flex flex-col">
                                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative">
                                       <table className="w-full text-left whitespace-nowrap text-xs text-on-surface font-mono">
                                          <thead className="sticky top-0 bg-surface-container/90 backdrop-blur-md z-10">
                                             <tr>
                                                {Object.keys(executionPreview[0] || {}).map(k => (
                                                   <th key={k} className="px-4 py-3 border-b border-white/10 font-label tracking-wider">{k}</th>
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
                           ) : (
                              <div className="flex-1 flex flex-col justify-center items-center opacity-40 text-center px-4 text-on-surface-variant">
                                 <Database className="w-12 h-12 mb-4" />
                                 <p className="font-mono text-sm">Awaiting resulting nodes from Coder environment.</p>
                              </div>
                           )}
                        </div>
                    </div>
                 </div>
             )}

             {/* QA VIEW */}
             {activeAgentView === 'qa' && (
                <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden h-full">
                    <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white mb-6 pb-4 border-b border-white/10 shrink-0">Quality Assurance Report</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {qaResult ? (
                            <div className="bg-surface-container-high p-6 rounded-xl border border-white/5 space-y-3 max-w-3xl mx-auto shadow-inner mt-4">
                                {qaResult.issues_found && qaResult.issues_found.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-primary font-mono text-sm font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Alerts Triggered: {qaResult.issues_found.length}</p>
                                        <ul className="list-disc pl-5 text-on-surface space-y-2 opacity-90 font-mono text-xs">
                                           {qaResult.issues_found.map((issue, idx) => (
                                              <li key={idx} className="text-primary-dim">{issue}</li>
                                           ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-emerald-400 font-mono text-sm flex items-center gap-2 justify-center py-8"><ShieldCheck className="w-6 h-6"/> Data passed strict validation protocols perfectly.</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center items-center opacity-40 text-center h-full pt-12">
                               <ListChecks className="w-16 h-16 mb-4 text-on-surface-variant" />
                               <p className="font-mono text-sm text-on-surface-variant">Awaiting QA validation reports.</p>
                            </div>
                        )}
                    </div>
                </div>
             )}

             {/* MONITOR VIEW */}
             {activeAgentView === 'monitor' && (
                 <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden h-full">
                     <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white mb-6 pb-4 border-b border-white/10 shrink-0">System Performance Monitor</h3>
                     <div className="flex-1 flex flex-col justify-center items-center opacity-50 text-center h-full pt-12 hover:opacity-100 transition-opacity">
                        <Activity className="w-16 h-16 mb-4 text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)] animate-pulse" />
                        <p className="font-mono text-sm text-white">System container allocated. Telemetry streams active.</p>
                        <p className="font-mono text-xs text-on-surface-variant mt-2">Agent constraints hold structurally sound behavior paths.</p>
                     </div>
                 </div>
             )}

             {/* VISUALIZER VIEW */}
             {activeAgentView === 'visualizer' && (
                <div className="flex flex-col min-h-0 border border-white/5 bg-[#131314]/30 rounded-xl p-6 overflow-hidden h-full">
                    <h3 className="font-headline font-bold text-lg tracking-widest uppercase text-white mb-6 pb-4 border-b border-white/10 shrink-0">Interactive Data Visualizer</h3>
                    <div className="flex-1 overflow-hidden h-full relative border border-white/5 rounded-xl bg-surface-container/50">
                         {executionResultCsv || csvData ? (
                            <ChartViewer csvData={executionResultCsv || csvData} isDarkTheme={true} />
                         ) : (
                            <div className="flex flex-col justify-center items-center opacity-40 text-center h-full pt-12 absolute inset-0">
                               <BarChart3 className="w-16 h-16 mb-4 text-on-surface-variant" />
                               <p className="font-mono text-sm text-on-surface-variant">Awaiting dataset vectorization to compile charts.</p>
                            </div>
                         )}
                    </div>
                </div>
             )}

          </div>

          `;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log('Successfully injected conditional tab views');
} else {
  console.log('Markers not found!');
  process.exit(1);
}
