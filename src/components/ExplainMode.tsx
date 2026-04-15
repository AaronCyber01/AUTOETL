import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { pyodideService } from '../services/pyodideService';

export function ExplainMode({ 
  csvData, 
  plan, 
  stepAnnotations 
}: { 
  csvData: string; 
  plan: any; 
  stepAnnotations: { stepNumber: number; codeSnippet: string }[];
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepResults, setStepResults] = useState<{ [key: number]: any }>({});

  const handleExecuteStep = async (index: number) => {
    setIsExecuting(true);
    try {
      // Accumulate code up to this step
      const codeToRun = stepAnnotations.slice(0, index + 1).map(s => s.codeSnippet).join('\n');
      const result = await pyodideService.executeStep(csvData, codeToRun);
      
      setStepResults(prev => ({
        ...prev,
        [index]: result
      }));
      setCurrentStepIndex(index);
    } catch (error) {
      console.error("Step execution failed", error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      {stepAnnotations.map((annotation, index) => {
        const planStep = plan.steps.find((s: any) => s.stepNumber === annotation.stepNumber);
        const hasExecuted = currentStepIndex >= index;
        const result = stepResults[index];

        return (
          <div key={index} className={`border rounded-xl overflow-hidden ${hasExecuted ? 'border-[#E8572A]/50' : 'border-[#222222]'}`}>
            <div className="bg-[#1C1C1C] p-3 flex justify-between items-center border-b border-[#222222]">
              <div>
                <span className="font-semibold text-[13px] text-white">Step {annotation.stepNumber}: </span>
                <span className="text-[13px] text-[#AAAAAA]">{planStep?.description || "Execute code"}</span>
              </div>
              <Button 
                size="sm" 
                variant={hasExecuted ? "secondary" : "default"}
                onClick={() => handleExecuteStep(index)}
                disabled={isExecuting || (index > 0 && currentStepIndex < index - 1)}
                className={hasExecuted ? "bg-[#222222] text-white hover:bg-[#E8572A] hover:text-white" : ""}
              >
                {isExecuting && currentStepIndex === index - 1 ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                {hasExecuted ? "Re-run Step" : "Run Step"}
              </Button>
            </div>
            <div className="p-3 bg-[#111111] text-[#AAAAAA] font-mono text-xs overflow-x-auto">
              <pre><code>{annotation.codeSnippet}</code></pre>
            </div>
            {result && (
              <div className="p-3 bg-[#1C1C1C] border-t border-[#222222] text-xs">
                <div className="flex gap-4 mb-2 text-[#E8572A] font-medium">
                  <span>Rows: {result.rowCount}</span>
                  <span>Columns: {result.colCount}</span>
                </div>
                <div className="overflow-x-auto border rounded-xl border-[#222222] bg-[#141414]">
                  <div className="p-2 text-[#888888] italic">Step executed successfully. Data transformed.</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
