import React, { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, CheckCircle2, Database, Hash, Calendar, Type, ToggleLeft } from 'lucide-react';

interface ColumnProfile {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text';
  uniqueCount: number;
  nullPct: number;
  sampleValues: string[];
}

interface DatasetProfile {
  summary: {
    totalRows: number;
    totalColumns: number;
    overallMissingPct: number;
    duplicateRows: number;
  };
  columns: ColumnProfile[];
}

interface DataProfilerProps {
  profile: DatasetProfile;
  onActionClick?: (action: string) => void;
  isGenerating?: boolean;
}

export function DataProfiler({ profile, onActionClick, isGenerating }: DataProfilerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const suggestions = useMemo(() => {
    const suggs: { text: string; type: 'warning' | 'info' | 'success'; action: string }[] = [];

    // Data quality issues first
    if (profile.summary.duplicateRows > 0) {
      suggs.push({
        text: `Found ${profile.summary.duplicateRows} duplicate rows. Consider deduplicating.`,
        type: 'warning',
        action: 'Drop duplicate rows'
      });
    }

    const highNullCols = profile.columns.filter(c => c.nullPct > 5);
    if (highNullCols.length > 0) {
      const colNames = highNullCols.map(c => c.name).slice(0, 2).join(', ') + (highNullCols.length > 2 ? '...' : '');
      suggs.push({
        text: `High missing values in ${colNames}. Suggest imputation.`,
        type: 'warning',
        action: `Impute nulls in ${highNullCols[0].name}`
      });
    }

    const dateCols = profile.columns.filter(c => c.type === 'datetime');
    if (dateCols.length > 0) {
      suggs.push({
        text: `Datetime column '${dateCols[0].name}' detected. Extract date features?`,
        type: 'info',
        action: `Extract year, month, and day-of-week from ${dateCols[0].name}`
      });
    }

    const cleanCatCols = profile.columns.filter(c => c.type === 'categorical' && c.nullPct === 0);
    if (cleanCatCols.length > 0) {
      suggs.push({
        text: `Clean categorical column '${cleanCatCols[0].name}' is ready for segmentation.`,
        type: 'success',
        action: `Group by ${cleanCatCols[0].name} and calculate summary statistics`
      });
    }

    return suggs.slice(0, 4);
  }, [profile]);

  const quickActions = useMemo(() => {
    const actions = new Set<string>();
    
    if (profile.summary.duplicateRows > 0) {
      actions.add('Drop duplicate rows');
    }
    
    const highNullCols = profile.columns.filter(c => c.nullPct > 5);
    if (highNullCols.length > 0) {
      actions.add(`Impute nulls in ${highNullCols[0].name}`);
    }
    
    const dateCols = profile.columns.filter(c => c.type === 'datetime');
    if (dateCols.length > 0) {
      actions.add(`Extract date features from ${dateCols[0].name}`);
    }
    
    const textCols = profile.columns.filter(c => c.type === 'text');
    if (textCols.length > 0) {
      actions.add(`Normalize text in ${textCols[0].name}`);
    }
    
    actions.add('Show full column statistics');
    
    // Fill up to 5 if needed
    if (actions.size < 5) {
      const numericCols = profile.columns.filter(c => c.type === 'numeric');
      if (numericCols.length > 0) {
        actions.add(`Scale numeric column ${numericCols[0].name}`);
      }
    }
    
    return Array.from(actions).slice(0, 5);
  }, [profile]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <Hash className="w-3 h-3 mr-1" />;
      case 'categorical': return <Database className="w-3 h-3 mr-1" />;
      case 'datetime': return <Calendar className="w-3 h-3 mr-1" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3 mr-1" />;
      default: return <Type className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <div className={`overflow-hidden mb-6 shadow-sm border border-white/10 rounded-xl bg-surface-container-high/80 ${isGenerating ? 'animate-pulse' : ''}`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 neon-orange-shadow">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-white tracking-wide">Data Profiler Report</h3>
            <p className="text-[10px] text-tertiary-container uppercase tracking-widest font-label mt-0.5">Automatic dataset analysis</p>
          </div>
        </div>
        <button className="text-neutral-500 hover:text-white transition-colors p-2">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-white/5 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-surface-container border border-white/5 shadow-inner rounded-xl">
              <CardContent className="p-4 pl-5">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Total Rows</p>
                <p className="text-2xl font-bold font-headline text-white">{profile.summary.totalRows.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-container border border-white/5 shadow-inner rounded-xl">
              <CardContent className="p-4 pl-5">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Total Columns</p>
                <p className="text-2xl font-bold font-headline text-white">{profile.summary.totalColumns.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-container border border-white/5 shadow-inner rounded-xl">
              <CardContent className="p-4 pl-5">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Missing Cells</p>
                <p className="text-2xl font-bold font-headline text-primary">{profile.summary.overallMissingPct.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="bg-surface-container border border-white/5 shadow-inner rounded-xl">
              <CardContent className="p-4 pl-5">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Duplicate Rows</p>
                <p className="text-2xl font-bold font-headline text-secondary">{profile.summary.duplicateRows.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-label uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Smart Suggestions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((sugg, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-container border border-white/5 hover:border-primary/50 cursor-pointer transition-colors shadow-none"
                    onClick={() => onActionClick && onActionClick(sugg.action)}
                  >
                    {sugg.type === 'warning' && <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                    {sugg.type === 'info' && <Lightbulb className="w-4 h-4 text-secondary mt-0.5 shrink-0" />}
                    {sugg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                    <p className="text-xs font-mono text-on-surface leading-loose">{sugg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column Overview */}
          <div>
            <h4 className="text-xs font-label uppercase tracking-widest text-neutral-400 mb-3">Column Overview</h4>
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-surface-container shadow-inner pb-1">
              <table className="w-full text-xs text-left font-mono">
                <thead className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3 font-semibold border-b border-white/5">Column Name</th>
                    <th className="px-5 py-3 font-semibold border-b border-white/5">Type</th>
                    <th className="px-5 py-3 font-semibold border-b border-white/5">Unique</th>
                    <th className="px-5 py-3 font-semibold border-b border-white/5">Null %</th>
                    <th className="px-5 py-3 font-semibold border-b border-white/5 w-1/3">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-on-surface">
                  {profile.columns.map((col, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-bold text-white tracking-wide">{col.name}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="flex w-fit items-center border-secondary/30 text-secondary bg-secondary/5 rounded-full font-label tracking-widest text-[9px] uppercase">
                          {getTypeIcon(col.type)}
                          {col.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-neutral-400">{col.uniqueCount.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${col.nullPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-primary font-bold">{col.nullPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[10px] text-on-surface-variant truncate max-w-[200px]">
                        {col.sampleValues.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-xs font-label uppercase tracking-widest text-neutral-400 mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <Badge 
                  key={i}
                  variant="outline" 
                  className="cursor-pointer bg-white/5 text-on-surface border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary transition-colors py-1.5 px-3 rounded-full font-mono text-[10px] shadow-sm uppercase tracking-widest"
                  onClick={() => onActionClick && onActionClick(action)}
                >
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
