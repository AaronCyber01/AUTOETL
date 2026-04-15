import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import 'hammerjs';
import zoomPlugin from 'chartjs-plugin-zoom';
import Papa from 'papaparse';
import { Download, RefreshCcw, BarChart3, PieChart, LineChart, ScatterChart } from 'lucide-react';

Chart.register(zoomPlugin);

interface ChartViewerProps {
  csvData: string;
  isDarkTheme?: boolean;
}

export function ChartViewer({ csvData, isDarkTheme = true }: ChartViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Store chart instances so we can destroy them
  const chartInstances = useRef<Chart[]>([]);

  // Dark theme palette
  const neonPalette = [
    'rgba(0, 227, 253, 0.8)',   // Neon Cyan
    'rgba(255, 144, 100, 0.8)', // Neon Orange
    'rgba(16, 185, 129, 0.8)',  // Emerald
    'rgba(167, 139, 250, 0.8)', // Purple
    'rgba(244, 63, 94, 0.8)',   // Rose
    'rgba(250, 204, 21, 0.8)',  // Yellow
  ];

  const borderPalette = [
    '#00e3fd',
    '#ff9064',
    '#34d399',
    '#c084fc',
    '#fb7185',
    '#fde047',
  ];

  useEffect(() => {
    if (!csvData) {
      setError("No data provided to visualizer.");
      return;
    }

    // Clean up previous charts
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    try {
      const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
      const data = parsed.data as Record<string, any>[];
      
      if (data.length === 0) {
        setError("Dataset is empty.");
        return;
      }

      const headers = parsed.meta.fields || Object.keys(data[0]);
      
      // Infer types
      const numCols: string[] = [];
      const catCols: string[] = [];

      headers.forEach(header => {
        let isNum = true;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          const val = data[i][header];
          if (val && isNaN(Number(val))) {
            isNum = false;
            break;
          }
        }
        if (isNum) numCols.push(header);
        else catCols.push(header);
      });

      if (numCols.length === 0) {
         setError("No numeric columns found to visualize.");
         return;
      }

      // Generate Chart Configs
      const chartsToRender: any[] = [];
      
      // We aim for 4 charts: 
      // 1. Bar chart (Category vs Sum of Numeric)
      // 2. Doughnut (Category vs Count)
      // 3. Line Chart (Numeric vs Numeric or Index vs Numeric)
      // 4. Scatter or Radar depending on dimensions

      // 1. Bar Chart
      if (catCols.length > 0 && numCols.length > 0) {
        const cat = catCols[0];
        const num = numCols[0];
        
        // Aggregate
        const agg: Record<string, number> = {};
        data.forEach(row => {
           const k = row[cat] || 'Unknown';
           agg[k] = (agg[k] || 0) + Number(row[num] || 0);
        });

        const labels = Object.keys(agg).slice(0, 15);
        const values = labels.map(l => agg[l]);

        chartsToRender.push({
           id: 'chart-bar',
           type: 'bar',
           title: `Sum of ${num} by ${cat}`,
           data: {
             labels,
             datasets: [{
               label: num,
               data: values,
               backgroundColor: neonPalette,
               borderColor: borderPalette,
               borderWidth: 1,
               borderRadius: 4
             }]
           }
        });

        // 2. Doughnut Chart (Count by Category)
        const counts: Record<string, number> = {};
        data.forEach(row => {
            const k = row[cat] || 'Unknown';
            counts[k] = (counts[k] || 0) + 1;
        });

        const dLabels = Object.keys(counts).slice(0, 10);
        const dValues = dLabels.map(l => counts[l]);

        chartsToRender.push({
            id: 'chart-doughnut',
            type: 'doughnut',
            title: `Count Distribution of ${cat}`,
            data: {
              labels: dLabels,
              datasets: [{
                data: dValues,
                backgroundColor: borderPalette.map(c => c + '33'), // 20% opacity using hex
                borderColor: borderPalette,
                borderWidth: 2,
                hoverOffset: 10
              }]
            }
        });
      } else if (numCols.length >= 2) {
         // Fallback if no category columns
         chartsToRender.push({
             id: 'chart-bar-fallback',
             type: 'bar',
             title: `Values of ${numCols[0]} (First 20 rows)`,
             data: {
                 labels: data.slice(0, 20).map((_, i) => `Row ${i}`),
                 datasets: [{
                     label: numCols[0],
                     data: data.slice(0, 20).map(r => r[numCols[0]]),
                     backgroundColor: neonPalette[0],
                     borderColor: borderPalette[0],
                     borderWidth: 1
                 }]
             }
         });
      }

      // 3. Line Chart
      if (numCols.length > 0) {
        chartsToRender.push({
           id: 'chart-line',
           type: 'line',
           title: `Trend of ${numCols[0]} over index`,
           data: {
              labels: data.slice(0, 50).map((_, i) => i.toString()),
              datasets: [{
                 label: numCols[0],
                 data: data.slice(0, 50).map(r => Number(r[numCols[0]] || 0)),
                 borderColor: borderPalette[1],
                 backgroundColor: neonPalette[1],
                 borderWidth: 2,
                 tension: 0.4,
                 fill: true,
                 pointBackgroundColor: borderPalette[1]
              }]
           }
        });
      }

      // 4. Scatter Chart or secondary Line
      if (numCols.length >= 2) {
         chartsToRender.push({
             id: 'chart-scatter',
             type: 'scatter',
             title: `Correlation: ${numCols[0]} vs ${numCols[1]}`,
             data: {
                 datasets: [{
                     label: 'Scatter',
                     data: data.slice(0, 100).map(r => ({
                         x: Number(r[numCols[0]] || 0),
                         y: Number(r[numCols[1]] || 0)
                     })),
                     backgroundColor: neonPalette[2],
                     borderColor: borderPalette[2],
                     pointRadius: 5,
                     pointHoverRadius: 8
                 }]
             }
         });
      } else if (numCols.length === 1 && catCols.length > 0) {
          // Additional polar area if we only have 1 num col
          const cat = catCols[0];
          const num = numCols[0];
          const counts: Record<string, number> = {};
          data.forEach(row => {
             const k = row[cat] || 'Unknown';
             counts[k] = (counts[k] || 0) + 1;
          });
          const labels = Object.keys(counts).slice(0, 7);
          const values = labels.map(l => counts[l]);
          
          chartsToRender.push({
              id: 'chart-polar',
              type: 'polarArea',
              title: `Polar Ratio of ${cat}`,
              data: {
                  labels,
                  datasets: [{
                      data: values,
                      backgroundColor: neonPalette,
                      borderColor: borderPalette,
                      borderWidth: 2
                  }]
              }
          });
      }

      // Ensure we fill exactly up to 4 or max available without duplicates ideally
      // Actually we just run rendering logic over whatever chartsToRender holds
      const finalCharts = chartsToRender.slice(0, 4);
      
      setTimeout(() => {
          finalCharts.forEach((cfg, index) => {
             const canvas = document.getElementById(cfg.id) as HTMLCanvasElement;
             if (!canvas) return;
             
             const existingChart = Chart.getChart(canvas);
             if (existingChart) {
                 existingChart.destroy();
             }
             
             const ctx = canvas.getContext('2d');
             if (!ctx) return;

             const isRadial = ['polarArea', 'pie', 'doughnut'].includes(cfg.type);

             const chart = new Chart(ctx, {
                 type: cfg.type,
                 data: cfg.data,
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                         title: {
                             display: true,
                             text: cfg.title,
                             color: isDarkTheme ? '#a1a1aa' : '#3f3f46',
                             font: { family: "'Space Grotesk', sans-serif", size: 14 }
                         },
                         legend: {
                             display: isRadial,
                             position: 'right',
                             labels: {
                                 color: isDarkTheme ? '#d4d4d8' : '#3f3f46',
                                 font: { family: "'Manrope', sans-serif", size: 10 }
                             }
                         },
                         tooltip: {
                             backgroundColor: 'rgba(0,0,0,0.8)',
                             titleColor: '#00e3fd',
                             bodyColor: '#ffffff',
                             borderColor: 'rgba(255,255,255,0.1)',
                             borderWidth: 1,
                             padding: 10,
                             cornerRadius: 8
                         }
                     },
                     scales: !isRadial ? {
                         x: {
                             grid: {
                                 color: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                             },
                             ticks: {
                                 color: isDarkTheme ? '#71717a' : '#3f3f46',
                                 font: { family: "'Manrope', sans-serif", size: 11 }
                             }
                         },
                         y: {
                             grid: {
                                 color: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                             },
                             ticks: {
                                 color: isDarkTheme ? '#71717a' : '#3f3f46',
                                 font: { family: "'Manrope', sans-serif", size: 11 }
                             }
                         }
                     } : undefined
                 }
             });

             chartInstances.current.push(chart);
          });
      }, 0); // push to next event loop after render

      setError(null);
    } catch (e: any) {
      console.error("Error generating visualizer maps", e);
      setError("Failed to parse data for charts.");
    }

  }, [csvData, isDarkTheme]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-error border border-error/20 bg-error/10 rounded-xl p-8 text-center font-mono text-sm leading-relaxed">
        <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
        {error}
      </div>
    );
  }

  // Predefine render blocks based on IDs
  return (
    <div ref={containerRef} className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-6 p-2 overflow-y-auto custom-scrollbar">
       
       <div className="bg-surface-container/50 border border-white/5 rounded-xl p-4 shadow-inner relative group h-[300px]">
          <canvas id="chart-bar" className="w-full h-full"></canvas>
       </div>
       
       <div className="bg-surface-container/50 border border-white/5 rounded-xl p-4 shadow-inner relative group h-[300px]">
          <canvas id="chart-doughnut" className="w-full h-full"></canvas>
       </div>

       <div className="bg-surface-container/50 border border-white/5 rounded-xl p-4 shadow-inner relative group h-[300px]">
          <canvas id="chart-line" className="w-full h-full"></canvas>
       </div>

       <div className="bg-surface-container/50 border border-white/5 rounded-xl p-4 shadow-inner relative group h-[300px]">
          <canvas id="chart-scatter" className="w-full h-full"></canvas>
          <canvas id="chart-polar" className="w-full h-full absolute inset-4 pointer-events-none opacity-0"></canvas>
          <canvas id="chart-bar-fallback" className="w-full h-full absolute inset-4 pointer-events-none opacity-0"></canvas>
       </div>

    </div>
  );
}
