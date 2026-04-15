import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Youtube, 
  Link as LinkIcon, 
  Download, 
  Share2, 
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getYouTubeId, formatTime } from '@/src/lib/youtube';
import { VideoPlayer } from '@/src/components/VideoPlayer';
import { TrimSlider } from '@/src/components/TrimSlider';
import { AISuggestions } from '@/src/components/AISuggestions';

export default function App() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = getYouTubeId(url);
    if (id) {
      setVideoId(id);
      setTranscript([]);
      setError(null);
      setIsDone(false);
      setDownloadUrl(null);
      
      // Fetch transcript from our server
      try {
        const res = await fetch('/api/youtube/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: id })
        });
        const data = await res.json();
        if (data.transcript) {
          setTranscript(data.transcript);
        }
      } catch (err) {
        console.error("Transcript fetch failed", err);
      }
    } else {
      setError("Invalid YouTube URL");
    }
  };

  const handlePlayerReady = (p: any) => {
    setPlayer(p);
  };

  const handleDurationUpdate = (d: number) => {
    if (d > 0 && d !== duration) {
      setDuration(d);
      setRange([0, Math.min(d, 60)]);
    }
  };

  const handleSelectSuggestion = (start: number, end: number) => {
    setRange([start, end]);
    player?.seekTo(start);
  };

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/youtube/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          start: range[0],
          end: range[1]
        })
      });
      const data = await res.json();
      if (data.success) {
        setDownloadUrl(data.downloadUrl);
        setIsDone(true);
      } else {
        setError(data.error || "Failed to process video.");
      }
    } catch (err) {
      console.error("Trim request failed", err);
      setError("Server error while processing video.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
    }
  };

  const setShortsPreset = (seconds: number) => {
    const start = range[0];
    const end = Math.min(start + seconds, duration);
    setRange([start, end]);
  };

  const updateRangeFromInput = (type: 'start' | 'end', field: 'min' | 'sec', value: string) => {
    const numValue = parseInt(value) || 0;
    const currentStart = range[0];
    const currentEnd = range[1];
    
    if (type === 'start') {
      const min = field === 'min' ? numValue : Math.floor(currentStart / 60);
      const sec = field === 'sec' ? numValue : Math.floor(currentStart % 60);
      const newStart = Math.min(min * 60 + sec, currentEnd - 1);
      setRange([Math.max(0, newStart), currentEnd]);
    } else {
      const min = field === 'min' ? numValue : Math.floor(currentEnd / 60);
      const sec = field === 'sec' ? numValue : Math.floor(currentEnd % 60);
      const newEnd = Math.max(min * 60 + sec, currentStart + 1);
      setRange([currentStart, Math.min(newEnd, duration)]);
    }
  };

  const startMinSec = {
    min: Math.floor(range[0] / 60),
    sec: Math.floor(range[0] % 60)
  };

  const endMinSec = {
    min: Math.floor(range[1] / 60),
    sec: Math.floor(range[1] % 60)
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-primary/30 flex flex-col">
      {/* Header */}
      <header className="h-[72px] px-10 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-extrabold tracking-tighter">
            clip<span className="text-primary">.it</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          Simple YouTube Trimmer
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col gap-8">
        {!videoId ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-white/[0.03] rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
              <Scissors className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Trim any YouTube video.</h2>
            <p className="text-muted-foreground mb-10 max-w-md text-lg">
              Paste a link below to start. No complex tools, just simple trimming.
            </p>
            <form onSubmit={handleUrlSubmit} className="w-full max-w-lg flex gap-3">
              <div className="relative flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 flex items-center focus-within:border-primary/50 transition-colors">
                <LinkIcon className="w-5 h-5 text-muted-foreground mr-4" />
                <input 
                  placeholder="Paste YouTube URL here..." 
                  className="flex-1 bg-transparent border-none outline-none h-14 text-base"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button type="submit" className="h-14 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">
                Start
              </Button>
            </form>
            {error && (
              <p className="text-red-500 text-sm mt-6 flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setVideoId(null)} className="rounded-full hover:bg-white/10">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold truncate max-w-md">Trimming Video</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase font-bold mr-2">Presets:</span>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold border-white/10" onClick={() => setShortsPreset(15)}>15s</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold border-white/10" onClick={() => setShortsPreset(30)}>30s</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold border-white/10" onClick={() => setShortsPreset(60)}>60s (Shorts)</Button>
              </div>
            </div>

            <div className="bg-black rounded-[24px] border border-white/10 shadow-2xl overflow-hidden">
              <div className="aspect-video relative">
                <VideoPlayer 
                  videoId={videoId} 
                  onReady={handlePlayerReady}
                  onTimeUpdate={setCurrentTime}
                  onDurationUpdate={handleDurationUpdate}
                />
              </div>
              
              <div className="bg-[#1A1A1C] p-8 space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-full w-14 h-14 bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 shrink-0"
                      onClick={() => player?.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo()}
                    >
                      {player?.getPlayerState() === 1 ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                    
                    <div className="flex items-center gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Start Time</label>
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            className="w-14 h-10 bg-white/5 border-white/10 text-center font-mono text-sm" 
                            value={startMinSec.min}
                            onChange={(e) => updateRangeFromInput('start', 'min', e.target.value)}
                          />
                          <span className="text-white/20">:</span>
                          <Input 
                            type="number" 
                            className="w-14 h-10 bg-white/5 border-white/10 text-center font-mono text-sm" 
                            value={startMinSec.sec}
                            onChange={(e) => updateRangeFromInput('start', 'sec', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="text-white/10 pt-6">—</div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">End Time</label>
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            className="w-14 h-10 bg-white/5 border-white/10 text-center font-mono text-sm" 
                            value={endMinSec.min}
                            onChange={(e) => updateRangeFromInput('end', 'min', e.target.value)}
                          />
                          <span className="text-white/20">:</span>
                          <Input 
                            type="number" 
                            className="w-14 h-10 bg-white/5 border-white/10 text-center font-mono text-sm" 
                            value={endMinSec.sec}
                            onChange={(e) => updateRangeFromInput('end', 'sec', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    {isDone ? (
                      <Button 
                        size="lg"
                        className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 shadow-lg shadow-green-500/20"
                        onClick={handleDownload}
                      >
                        <Download className="w-5 h-5 mr-3" /> Download Clip
                      </Button>
                    ) : (
                      <Button 
                        size="lg"
                        className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-white text-black font-bold text-lg hover:bg-white/90"
                        onClick={handleProcess}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Processing...</>
                        ) : (
                          <><Scissors className="w-5 h-5 mr-3" /> Trim Video</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="pt-4">
                  <TrimSlider 
                    duration={duration}
                    range={range}
                    currentTime={currentTime}
                    onChange={setRange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Duration</div>
                <div className="font-bold text-primary">{formatTime(range[1] - range[0])}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Format</div>
                <div className="font-bold">MP4 (1080p)</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Watermark</div>
                <div className="font-bold">None</div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
