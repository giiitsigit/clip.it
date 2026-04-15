import React from 'react';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/src/lib/youtube';

interface TrimSliderProps {
  duration: number;
  range: [number, number];
  onChange: (range: [number, number]) => void;
  currentTime: number;
}

export const TrimSlider: React.FC<TrimSliderProps> = ({ duration, range, onChange, currentTime }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        <span>{formatTime(0)}</span>
        <span>{formatTime(duration / 2)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      <div className="relative h-12 bg-white/[0.05] rounded-lg overflow-hidden group">
        {/* Selection Highlight */}
        <div 
          className="absolute h-full bg-primary/15 border-x-2 border-primary z-0"
          style={{ 
            left: `${(range[0] / duration) * 100}%`, 
            width: `${((range[1] - range[0]) / duration) * 100}%` 
          }}
        />

        {/* Current Time Playhead */}
        <div 
          className="absolute top-0 w-0.5 h-full bg-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
        
        <Slider
          defaultValue={[0, duration]}
          max={duration}
          step={1}
          value={[range[0], range[1]]}
          onValueChange={(val) => onChange(val as [number, number])}
          className="absolute inset-0 z-20 cursor-pointer"
        />
        
        {/* Visual Slider (Since the real one is transparent for better control) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 pointer-events-none" />
      </div>
    </div>
  );
};
