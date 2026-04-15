import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  onReady?: (player: any) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationUpdate?: (duration: number) => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onReady, onTimeUpdate, onDurationUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const loadVideo = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        return;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            onReady?.(event.target);
            onDurationUpdate?.(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              onDurationUpdate?.(event.target.getDuration());
              intervalRef.current = window.setInterval(() => {
                onTimeUpdate?.(event.target.getCurrentTime());
              }, 500);
            } else if (event.data === window.YT.PlayerState.UNSTARTED || event.data === window.YT.PlayerState.CUED) {
              onDurationUpdate?.(event.target.getDuration());
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = loadVideo;
    } else {
      loadVideo();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoId]);

  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      <div ref={containerRef} />
    </div>
  );
};
