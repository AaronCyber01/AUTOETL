import React from 'react';
import { cn } from '@/src/lib/utils';

export function ConfidenceBar({ score, label = "Confidence" }: { score: number, label?: string }) {
  const percentage = Math.round(score * 100);
  const color = score > 0.8 ? 'bg-emerald-500' : score >= 0.5 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-[11px] font-medium mb-1 uppercase tracking-wider">
        <span className="text-[#888888]">{label}</span>
        <span className={cn(score < 0.5 ? 'text-[#E8572A]' : 'text-[#888888]')}>{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-[#111111] rounded-full overflow-hidden shadow-inner flex gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = (i + 1) * 10 <= percentage || (i * 10 < percentage && percentage > 0);
          return (
            <div
              key={i}
              className={cn(
                "h-full flex-1 transition-all duration-500 rounded-sm",
                isActive ? "bg-gradient-to-r from-[#E8572A] to-[#F4A261]" : "bg-[#1C1C1C]"
              )}
            />
          );
        })}
      </div>
      {score < 0.5 && (
        <p className="text-[11px] text-[#E8572A] mt-1">
          Low confidence — consider rephrasing your request or reviewing the output carefully.
        </p>
      )}
    </div>
  );
}
