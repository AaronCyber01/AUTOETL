export interface ProfilerResult {
  columns: { name: string; type: string; description: string }[];
  summary: string;
  confidence: number;
}

export interface PlannerResult {
  steps: { stepNumber: number; description: string; actionType: string }[];
  overallStrategy: string;
  confidence: number;
}

export interface CoderResult {
  code: string;
  explanation: string;
  confidence: number;
  stepAnnotations?: { stepNumber: number; codeSnippet: string }[];
}

export interface QAResult {
  passed: boolean;
  feedback: string;
  correctedCode?: string;
  confidence: number;
}

export interface MonitorResult {
  anomalies: string[];
  healthScore: number;
  recommendation: string;
  confidence: number;
}

export interface VisualizerResult {
  charts: {
    type: string;
    data: any;
    options: any;
    description: string;
  }[];
  confidence: number;
}

// Ensure you define VITE_BACKEND_URL in your deployed Vercel environment variables
// It should point to the URL of your deployed Render backend (e.g., https://autoetl-backend.onrender.com)
// @ts-ignore
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';

async function fetchFromBackend(endpoint: string, payload: any) {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || ('Backend request failed with status ' + res.status));
    }
    
    return await res.json();
}

export const geminiService = {
  async runProfiler(datasetProfile: any): Promise<ProfilerResult> {
    return fetchFromBackend('/api/runProfiler', { datasetProfile });
  },

  async runPlanner(schema: ProfilerResult, userRequest: string): Promise<PlannerResult> {
    return fetchFromBackend('/api/runPlanner', { schema, userRequest });
  },

  async runCoder(schema: ProfilerResult, plan: PlannerResult, userRequest: string, anomalyReport?: MonitorResult): Promise<CoderResult> {
    return fetchFromBackend('/api/runCoder', { schema, plan, userRequest, anomalyReport });
  },

  async runQA(schema: ProfilerResult, plan: PlannerResult, code: string, userRequest: string): Promise<QAResult> {
    return fetchFromBackend('/api/runQA', { schema, plan, code, userRequest });
  },

  async runMonitor(inputStats: any, outputStats: any, userRequest: string): Promise<MonitorResult> {
    return fetchFromBackend('/api/runMonitor', { inputStats, outputStats, userRequest });
  },

  async runVisualizer(outputDataSample: any[], schema: ProfilerResult, userRequest: string): Promise<VisualizerResult> {
    return fetchFromBackend('/api/runVisualizer', { outputDataSample, schema, userRequest });
  }
};
