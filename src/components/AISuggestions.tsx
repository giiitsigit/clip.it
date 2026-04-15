import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/src/lib/youtube';

interface Suggestion {
  start: number;
  end: number;
  label: string;
  reason: string;
}

interface AISuggestionsProps {
  videoId: string;
  transcript: any[];
  onSelect: (start: number, end: number) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({ videoId, transcript, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const generateSuggestions = async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not defined");
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare transcript for AI
      const transcriptText = transcript.map(t => `[${Math.floor(t.offset / 1000)}s] ${t.text}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this YouTube video transcript and suggest 3-5 interesting clips or highlights.
        Return the response as a JSON array of objects with 'start' (seconds), 'end' (seconds), 'label' (short title), and 'reason' (why it's a highlight).
        
        Transcript:
        ${transcriptText.slice(0, 5000)}`, // Limit transcript size
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                label: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["start", "end", "label", "reason"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setSuggestions(data);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1A1A1C] border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
          AI Highlights
          <Badge className="bg-primary text-white text-[9px] px-1.5 py-0 h-4 font-bold border-none">FREE</Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={generateSuggestions}
          disabled={loading || transcript.length === 0}
          className="h-7 px-2 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/10"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      <ScrollArea className="h-[280px] -mr-2 pr-2">
        <div className="flex flex-col gap-2.5">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <div 
                key={i}
                className="group p-3 rounded-xl border border-white/[0.05] bg-white/[0.03] hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                onClick={() => onSelect(s.start, s.end)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{s.label}</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {Math.floor(s.end - s.start)}s
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{s.reason}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  {formatTime(s.start)} - {formatTime(s.end)}
                </div>
              </div>
            ))
          ) : (
            <div className="h-[100px] flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl border-white/10">
              <p className="text-[11px] text-muted-foreground">
                {transcript.length === 0 
                  ? "No transcript available." 
                  : "Click 'Analyze' to find highlights."}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
