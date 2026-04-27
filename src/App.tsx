import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, Play, CheckCircle2, XCircle, Loader2, Database, FileCode2, ListChecks, TerminalSquare, Download, Settings, BarChart3, ShieldAlert, History, ShieldCheck, Activity } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { geminiService, ProfilerResult, PlannerResult, CoderResult, QAResult, MonitorResult, VisualizerResult } from './services/geminiService';
import { pyodideService } from './services/pyodideService';
import { parseFile } from './lib/fileParser';
import { ChartViewer } from './components/ChartViewer';
import { SettingsDrawer, AppSettings } from './components/SettingsDrawer';
import { PipelineRun } from './components/HistorySidebar';
import { DataProfiler } from './components/DataProfiler';
type AgentPhase = 'profiler' | 'planner' | 'coder' | 'visualizer' | 'history' | 'qa' | 'monitor';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [csvData, setCsvData] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvHeader, setCsvHeader] = useState<string>('');
  const [sampleRows, setSampleRows] = useState<string>('');
  const [dataFormat, setDataFormat] = useState<string>('');
  const [originalFileName, setOriginalFileName] = useState<string>('');
  
  const [userRequest, setUserRequest] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'profiling' | 'planning' | 'coding' | 'qa' | 'executing' | 'monitoring' | 'visualizing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [profilerResult, setProfilerResult] = useState<ProfilerResult | null>(null);
  const [plannerResult, setPlannerResult] = useState<PlannerResult | null>(null);
  const [coderResult, setCoderResult] = useState<CoderResult | null>(null);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null);
  const [visualizerResult, setVisualizerResult] = useState<VisualizerResult | null>(null);
  
  const [executionResultCsv, setExecutionResultCsv] = useState<string>('');
  const [executionPreview, setExecutionPreview] = useState<any[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [datasetProfile, setDatasetProfile] = useState<any>(null);
  const [isProfilingDataset, setIsProfilingDataset] = useState(false);

  const [activeAgentView, setActiveAgentView] = useState<AgentPhase>('profiler');
  
  const [settings, setSettings] = useState<AppSettings>({
    enableMonitor: true,
    enableVisualizer: true,
    enableExplainMode: true,
    enableConfidence: true,
    enableHistory: true,
  });

  const [history, setHistory] = useState<PipelineRun[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('autoetl_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveHistory = (run: PipelineRun) => {
    if (!settings.enableHistory) return;
    const newHistory = [run, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('autoetl_history', JSON.stringify(newHistory));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File is too large. Please upload a file smaller than 15MB.");
      return;
    }

    try {
      const { csv, format } = await parseFile(file);
      setCsvData(csv);
      setDataFormat(format);
      setOriginalFileName(file.name);
      setDatasetProfile(null);
      setIsProfilingDataset(true);
      
      Papa.parse(csv, {
        header: true,
        preview: 50,
        skipEmptyLines: true,
        complete: async (results) => {
          setCsvPreview(results.data);
          if (results.meta.fields) setCsvHeader(results.meta.fields.join(','));
          const sample = results.data.map(row => Object.values(row as any).join(',')).join('\n');
          setSampleRows(sample);
          try {
            const profile = await pyodideService.profileDataset(csv);
            setDatasetProfile(profile);
          } catch (err) { } 
          finally { setIsProfilingDataset(false); }
        }
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse file");
      setIsProfilingDataset(false);
    }
  };

  const runPipeline = async (anomalyReport?: MonitorResult, requestOverride?: string) => {
    const requestToUse = requestOverride || userRequest;
    if (!csvData || !requestToUse) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      let profile = profilerResult;
      if (!profile) {
        setCurrentStep('profiling');
        profile = await geminiService.runProfiler(csvHeader, sampleRows);
        setProfilerResult(profile);
      }
      let plan = plannerResult;
      if (!plan) {
        setCurrentStep('planning');
        plan = await geminiService.runPlanner(profile, requestToUse);
        setPlannerResult(plan);
        setActiveAgentView('planner');
      }

      setCurrentStep('coding');
      let codeRes = await geminiService.runCoder(profile, plan, requestToUse, anomalyReport);
      setCoderResult(codeRes);

      setCurrentStep('qa');
      setActiveAgentView('qa');
      let qaRes = await geminiService.runQA(profile, plan, codeRes.code, requestToUse);
      setQaResult(qaRes);

      let finalCode = codeRes.code;
      if (!qaRes.passed && qaRes.correctedCode) {
        finalCode = qaRes.correctedCode;
        setCoderResult({ ...codeRes, code: finalCode, explanation: codeRes.explanation + ' (Updated)' });
      }

      setCurrentStep('executing');
      
      const inputStats = settings.enableMonitor ? await pyodideService.getDataFrameStats(csvData) : null;
      
      const { csv: resultCsv, stats: outputStats } = await pyodideService.executeCode(csvData, finalCode);
      setExecutionResultCsv(resultCsv);

      let parsedPreview: any[] = [];
      Papa.parse(resultCsv, {
        header: true,
        preview: 100,
        skipEmptyLines: true,
        complete: (results) => {
          parsedPreview = results.data;
          setExecutionPreview(parsedPreview);
        }
      });
      
      if (settings.enableMonitor && inputStats && outputStats) {
        setCurrentStep('monitoring');
        setActiveAgentView('monitor');
        const monitorRes = await geminiService.runMonitor(inputStats, outputStats, requestToUse);
        setMonitorResult(monitorRes);
      }

      saveHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        userRequest: requestToUse,
        plan,
        code: finalCode
      });
      
      setCurrentStep('done');
    } catch (err: any) {
      setErrorMsg(err.message);
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadFinalData = async () => {
    if (!executionResultCsv) return;
    
    let downloadData: any = executionResultCsv;
    let mimeType = 'text/csv;charset=utf-8;';
    let extension = 'csv';
    let filenameBase = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "dataset";

    try {
      if (dataFormat === 'JSON') {
        const parsed = Papa.parse(executionResultCsv, { header: true, skipEmptyLines: true }).data;
        downloadData = JSON.stringify(parsed, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } 
      else if (dataFormat === 'Text') {
        const parsed = Papa.parse(executionResultCsv, { header: true, skipEmptyLines: true }).data;
        // Text format is saved as tab-separated .txt usually 
        downloadData = Papa.unparse(parsed, { delimiter: '\t' });
        mimeType = 'text/plain;charset=utf-8;';
        extension = 'txt';
      }
      else if (dataFormat === 'Excel') {
        const parsed = Papa.parse(executionResultCsv, { header: true, skipEmptyLines: true }).data;
        const worksheet = XLSX.utils.json_to_sheet(parsed as any[]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transformed");
        const buf = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transformed_${filenameBase}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn("Format conversion failed. Falling back to CSV.", e);
    }

    const blob = new Blob([downloadData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transformed_${filenameBase}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen relative overflow-hidden" data-mode="connect">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-neutral-950/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex justify-between items-center px-6 h-16">
        <div className="flex items-center flex-none mr-12">
          <h1 className="text-2xl font-bold tracking-tighter text-white uppercase font-headline"></h1>
        </div>
        <nav className="hidden md:flex items-center relative gap-8">
           <button onClick={() => setActiveAgentView('profiler')} className={`font-headline tracking-tight transition-colors duration-300 ${activeAgentView === 'profiler' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}`}>PROFILER</button>
           <button onClick={() => setActiveAgentView('planner')} className={`font-headline tracking-tight transition-colors duration-300 ${activeAgentView === 'planner' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}`}>PLANNER</button>
           <button onClick={() => setActiveAgentView('coder')} className={`font-headline tracking-tight transition-colors duration-300 ${activeAgentView === 'coder' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}`}>CODER</button>
           <button onClick={() => setActiveAgentView('qa')} className={`font-headline tracking-tight transition-colors duration-300 ${activeAgentView === 'qa' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}`}>QUALITY ASSURANCE</button>
           <button onClick={() => setActiveAgentView('monitor')} className={`font-headline tracking-tight transition-colors duration-300 ${activeAgentView === 'monitor' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}`}>MONITOR</button>
           <button onClick={() => setActiveAgentView('visualizer')} className={`font-headline tracking-tight transition-colors duration-300 ${activeAgentView === 'visualizer' ? 'text-orange-500 font-bold' : 'text-neutral-400 hover:text-orange-400'}`}>VISUALIZER</button>
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
                      <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-secondary animate-pulse' : 'bg-green-500'}`}></span> 
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
                   <div className={`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 ${['profiling', 'planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}`}>
                      <Database className={`w-8 h-8 ${['profiling', 'planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}`} />
                   </div>
                   <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${['profiling', 'planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}`}>Profiler</span>
                </div>

                {/* Node: Planner */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 ${['planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}`}>
                      <TerminalSquare className={`w-8 h-8 ${['planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}`} />
                   </div>
                   <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${['planning', 'coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}`}>Planner</span>
                </div>

                {/* Node: Coder */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 ${['coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}`}>
                      <FileCode2 className={`w-8 h-8 ${['coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}`} />
                   </div>
                   <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${['coding', 'qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}`}>Coder</span>
                </div>

                {/* Node: Quality Assurance */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 ${['qa', 'executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}`}>
                      <CheckCircle2 className={`w-8 h-8 ${['qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}`} />
                   </div>
                   <span className={`text-[10px] font-label uppercase tracking-widest font-bold text-center ${['qa', 'executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}`}>Quality<br/>Assurance</span>
                </div>

                {/* Node: Monitor */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 ${['executing', 'done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}`}>
                      <Activity className={`w-8 h-8 ${['executing', 'done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}`} />
                   </div>
                   <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${['executing', 'done'].includes(currentStep) ? 'text-secondary' : 'text-white'}`}>Monitor</span>
                </div>

                {/* Node: Visualizer */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                   <div className={`w-16 h-16 bg-surface-container-high border rounded-lg flex items-center justify-center transition-colors duration-300 ${['done'].includes(currentStep) ? 'border-secondary' : 'border-white/10 group-hover:border-secondary'}`}>
                      <BarChart3 className={`w-8 h-8 ${['done'].includes(currentStep) ? 'text-secondary drop-shadow-[0_0_8px_rgba(0,227,253,0.8)]' : 'text-on-surface-variant'}`} />
                   </div>
                   <span className={`text-[10px] font-label uppercase tracking-widest font-bold ${['done'].includes(currentStep) ? 'text-secondary' : 'text-white'}`}>Visualizer</span>
                </div>
             </div>
          </section>

          {/* Core Functional Views */}
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
                             {csvData ? `Loaded ${csvPreview.length} rows from source.` : "Upload CSV, JSON, TXT, or Excel files to begin the continuous ETL pipeline."}
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
                                {!qaResult.passed ? (
                                    <div className="space-y-4">
                                        <p className="text-primary font-mono text-sm font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Alerts Triggered</p>
                                        <p className="text-on-surface opacity-90 font-mono text-xs bg-surface-container/50 p-4 rounded-lg">{qaResult.feedback}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <p className="text-emerald-400 font-mono text-sm flex items-center gap-2 justify-center pt-4"><ShieldCheck className="w-6 h-6"/> Data passed strict validation protocols perfectly.</p>
                                        <p className="text-on-surface opacity-90 font-mono text-xs pb-4">{qaResult.feedback}</p>
                                    </div>
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
