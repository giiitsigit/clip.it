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

  const handleProcess = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 3000);
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
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1 font-bold">
                {formatTime(range[1] - range[0])} Selected
              </Badge>
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
              
              <div className="bg-[#1A1A1C] p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="rounded-full w-14 h-14 bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
                      onClick={() => player?.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo()}
                    >
                      {player?.getPlayerState() === 1 ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Selection Range</div>
                      <div className="text-2xl font-mono font-bold text-primary">
                        {formatTime(range[0])} <span className="text-white/20 mx-2">—</span> {formatTime(range[1])}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg"
                    className="h-14 px-10 rounded-2xl bg-white text-black font-bold text-lg hover:bg-white/90"
                    onClick={handleProcess}
                    disabled={isProcessing || isDone}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Processing...</>
                    ) : isDone ? (
                      <><CheckCircle2 className="w-5 h-5 mr-3" /> Download Ready</>
                    ) : (
                      <><Scissors className="w-5 h-5 mr-3" /> Trim & Download</>
                    )}
                  </Button>
                </div>

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
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Format</div>
                <div className="font-bold">MP4 (1080p)</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Quality</div>
                <div className="font-bold">High (Original)</div>
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
