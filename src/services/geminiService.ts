import { GoogleGenAI, Type } from "@google/genai";

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || 'MISSING_API_KEY' });
const MODEL_NAME = "gemini-3-flash-preview";
const FALLBACK_MODEL_NAME = "gemini-3.1-flash-lite";

async function generateContentWithFallback(params: any): Promise<any> {
    try {
        return await ai.models.generateContent(params);
    } catch (error: any) {
        if (error?.status === 429 && params.model === MODEL_NAME) {
            console.warn(`[AutoETL Failover] Rate limit (429) hit on ${MODEL_NAME}. Downgrading to fallback model: ${FALLBACK_MODEL_NAME}...`);
            return await generateContentWithFallback({
                ...params,
                model: FALLBACK_MODEL_NAME
            });
        }
        throw error;
    }
}

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

export const geminiService = {
  async runProfiler(csvHeader: string, sampleRows: string): Promise<ProfilerResult> {
    const prompt = `
You are an expert Data Profiler Agent.
Analyze the following CSV header and sample rows to determine the schema, data types, and provide a brief summary of the dataset.

CSV Header:
${csvHeader}

Sample Rows:
${sampleRows}
`;

    const response = await generateContentWithFallback({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            columns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, description: "e.g., integer, float, string, datetime, boolean" },
                  description: { type: Type.STRING, description: "Brief description of what this column likely represents" },
                },
                required: ["name", "type", "description"],
              },
            },
            summary: { type: Type.STRING, description: "A brief summary of the dataset based on the sample data" },
            confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0 about the accuracy of the profile" },
          },
          required: ["columns", "summary", "confidence"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async runPlanner(schema: ProfilerResult, userRequest: string): Promise<PlannerResult> {
    const prompt = `
You are an expert Data Engineering Planner Agent.
Based on the provided data schema and the user's natural language request, create a step-by-step plan to transform the data.

User Request: "${userRequest}"

Data Schema:
${JSON.stringify(schema, null, 2)}
`;

    const response = await generateContentWithFallback({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  actionType: { type: Type.STRING, description: "e.g., Filter, Aggregate, Clean, Join, Mutate" },
                },
                required: ["stepNumber", "description", "actionType"],
              },
            },
            overallStrategy: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0 about how well the plan maps to the user request" },
          },
          required: ["steps", "overallStrategy", "confidence"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async runCoder(schema: ProfilerResult, plan: PlannerResult, userRequest: string, anomalyReport?: MonitorResult): Promise<CoderResult> {
    const anomalyContext = anomalyReport ? `
PREVIOUS RUN ANOMALY REPORT (SELF-HEALING MODE):
The previous code execution resulted in anomalies. Please adjust your code to fix these issues:
${JSON.stringify(anomalyReport, null, 2)}
` : "";

    const prompt = `
You are an expert Data Engineering Coder Agent.
Write Python code using the \`pandas\` library to execute the provided transformation plan.

CRITICAL INSTRUCTIONS:
1. The input data is already loaded into a pandas DataFrame named \`df\`. DO NOT write code to load the data.
2. You MUST assign the final transformed DataFrame to a variable named \`result_df\`.
3. Do not include any print statements, plotting, or file saving code.
4. Only use standard pandas operations.
5. Ensure the code is robust and handles potential missing values if necessary.
6. CRITICAL: When converting string columns to numeric (float/int), you MUST handle non-numeric strings (like '?', 'N/A', 'NA', '', etc.) gracefully. Use \`pd.to_numeric(df['col'], errors='coerce')\` instead of \`df['col'].astype(float)\` to avoid ValueError.
7. CRITICAL: Before performing any numeric comparisons (e.g., >, <, >=, <=) on a column, you MUST ensure the column is converted to a numeric type using \`pd.to_numeric(..., errors='coerce')\`. Comparing strings to integers will cause a TypeError.
8. Break down your code into stepAnnotations, where each step corresponds to a stepNumber in the plan.

User Request: "${userRequest}"

Data Schema:
${JSON.stringify(schema, null, 2)}

Transformation Plan:
${JSON.stringify(plan, null, 2)}
${anomalyContext}
`;

    const response = await generateContentWithFallback({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING, description: "The complete Python pandas code. Do not include markdown formatting like \`\`\`python." },
            explanation: { type: Type.STRING, description: "Brief explanation of how the code implements the plan." },
            confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0 about the code correctness" },
            stepAnnotations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  codeSnippet: { type: Type.STRING, description: "The specific lines of code for this step" }
                },
                required: ["stepNumber", "codeSnippet"]
              }
            }
          },
          required: ["code", "explanation", "confidence"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async runQA(schema: ProfilerResult, plan: PlannerResult, code: string, userRequest: string): Promise<QAResult> {
    const prompt = `
You are an expert Data Engineering QA Agent.
Review the provided Python pandas code to ensure it correctly implements the transformation plan, is safe to execute, and meets the user's request.

CRITICAL CHECKS:
1. Does the code assume the input DataFrame is named \`df\`?
2. Does the code assign the final result to a variable named \`result_df\`?
3. Are there any security risks (e.g., os, sys, subprocess calls, file I/O)? If so, it MUST fail.
4. Does the code logically follow the plan and user request?
5. Does the code safely handle type conversions? (e.g., using \`pd.to_numeric(..., errors='coerce')\` instead of \`.astype(float)\` when converting strings that might contain '?' or 'N/A'). If it uses \`.astype(float)\` on potentially dirty string columns, it should fail and be corrected.
6. Does the code perform any numeric comparisons (>, <, >=, <=) on columns that might be strings? If so, it MUST convert them to numeric first using \`pd.to_numeric(..., errors='coerce')\`. Comparing strings to integers will cause a TypeError.

User Request: "${userRequest}"

Data Schema:
${JSON.stringify(schema, null, 2)}

Transformation Plan:
${JSON.stringify(plan, null, 2)}

Python Code to Review:
${code}
`;

    const response = await generateContentWithFallback({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passed: { type: Type.BOOLEAN, description: "True if the code is correct and safe, False otherwise." },
            feedback: { type: Type.STRING, description: "Explanation of why it passed or failed. If failed, detail the issues." },
            correctedCode: { type: Type.STRING, description: "If passed is false, provide the corrected Python code here. Ensure it still uses \`df\` as input and \`result_df\` as output." },
            confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0 about the QA assessment" },
          },
          required: ["passed", "feedback", "confidence"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async runMonitor(inputStats: any, outputStats: any, userRequest: string): Promise<MonitorResult> {
    const prompt = `
You are an expert Data Engineering Monitor Agent.
Compare the input DataFrame statistics with the output DataFrame statistics after a transformation pipeline.
Identify any anomalies such as unexpected data loss (>20% rows dropped unless requested), new nulls introduced, or unexpected type changes.
Assign a health score from 0 to 100. If the health score is < 60, the pipeline will self-heal.

User Request: "${userRequest}"

Input Stats:
${JSON.stringify(inputStats, null, 2)}

Output Stats:
${JSON.stringify(outputStats, null, 2)}
`;

    const response = await generateContentWithFallback({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthScore: { type: Type.INTEGER, description: "0 to 100" },
            recommendation: { type: Type.STRING },
            confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0" },
          },
          required: ["anomalies", "healthScore", "recommendation", "confidence"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async runVisualizer(outputDataSample: any[], schema: ProfilerResult, userRequest: string): Promise<VisualizerResult> {
    const prompt = `
You are an expert Data Visualization Agent.
Based on the output data schema, a sample of the output data, and the user's request, suggest the 3 most appropriate chart types.
Valid chart types are ONLY: 'bar', 'line', 'pie', 'doughnut', 'scatter', 'radar', 'polarArea', 'bubble'.
You are highly encouraged to use a VARIETY of charts, such as:
- Area Charts (type: 'line', dataset fill: true)
- Horizontal Bar Charts (type: 'bar', options: { indexAxis: 'y' })
- Stacked Bar Charts (type: 'bar', options: { scales: { x: { stacked: true }, y: { stacked: true } } })
- Mixed Charts (type: 'bar', but set one dataset's type to 'line')
- Radar and Polar Area charts for multi-variable comparisons.
Generate the Chart.js configuration JSON for each suggested chart.

User Request: "${userRequest}"

Output Data Schema:
${JSON.stringify(schema, null, 2)}

Output Data Sample (first 5 rows):
${JSON.stringify(outputDataSample, null, 2)}

CRITICAL INSTRUCTIONS:
1. You MUST provide the EXACT 'data' object populated with the sample data provided.
2. 'data.labels' MUST be an array of strings representing the X-axis or categories.
3. 'data.datasets' MUST be an array of objects. Each object MUST have a 'label' (string) and 'data' (array of numbers).
4. 'options' MUST be a valid Chart.js options object (can be empty {}).
5. Do NOT provide instructions, only the exact JSON configuration.
`;

    const response = await generateContentWithFallback({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            charts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Must be one of: 'bar', 'line', 'pie', 'doughnut', 'scatter', 'radar', 'polarArea', 'bubble'. Use 'bar' for horizontal/stacked bars. Use 'line' for area charts." },
                  data: { 
                    type: Type.OBJECT,
                    properties: {
                      labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                      datasets: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            type: { type: Type.STRING, description: "Optional. Override chart type for this dataset (e.g., 'line' inside a 'bar' chart for mixed charts)." },
                            label: { type: Type.STRING },
                            fill: { type: Type.BOOLEAN, description: "Set to true for area charts (only applies to 'line' type)." },
                            data: { 
                              type: Type.ARRAY, 
                              items: { 
                                type: Type.OBJECT,
                                properties: {
                                  x: { type: Type.NUMBER },
                                  y: { type: Type.NUMBER },
                                  r: { type: Type.NUMBER },
                                  value: { type: Type.NUMBER }
                                }
                              }, 
                              description: "Array of data points. For bar/line/pie/doughnut, use { value: number }. For bubble/scatter, use { x, y, r }." 
                            },
                            backgroundColor: { type: Type.ARRAY, items: { type: Type.STRING } },
                            borderColor: { type: Type.ARRAY, items: { type: Type.STRING } },
                            borderWidth: { type: Type.NUMBER }
                          },
                          required: ["label", "data"]
                        }
                      }
                    },
                    required: ["labels", "datasets"]
                  },
                  options: { type: Type.OBJECT },
                  description: { type: Type.STRING }
                },
                required: ["type", "data", "options", "description"]
              }
            },
            confidence: { type: Type.NUMBER },
          },
          required: ["charts", "confidence"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  }
};
