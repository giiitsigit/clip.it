import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure temp directory exists
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/youtube/transcript", async (req, res) => {
    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: "videoId is required" });
    }

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcript || transcript.length === 0) {
        return res.status(404).json({ error: "No transcript found for this video." });
      }
      res.json({ transcript });
    } catch (error) {
      console.error("Error fetching transcript:", error);
      res.status(500).json({ error: "Transcript is disabled or unavailable for this video." });
    }
  });

  app.post("/api/youtube/trim", async (req, res) => {
    const { videoId, start, end } = req.body;
    if (!videoId || start === undefined || end === undefined) {
      return res.status(400).json({ error: "videoId, start, and end are required" });
    }

    const outputFileName = `clip-${videoId}-${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, outputFileName);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      console.log(`Starting trim for ${videoId}: ${start}s to ${end}s`);
      
      // Get video stream
      const stream = ytdl(videoUrl, {
        quality: 'highestvideo',
        filter: format => format.container === 'mp4'
      });

      ffmpeg(stream)
        .setStartTime(start)
        .setDuration(end - start)
        .output(outputPath)
        .on('end', () => {
          console.log('Trimming finished');
          res.json({ success: true, downloadUrl: `/api/download/${outputFileName}` });
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          res.status(500).json({ error: "Failed to process video. FFmpeg might not be installed or video format is unsupported." });
        })
        .run();

    } catch (error) {
      console.error("Error trimming video:", error);
      res.status(500).json({ error: "Failed to start video processing." });
    }
  });

  app.get("/api/download/:filename", (req, res) => {
    const filePath = path.join(tempDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (!err) {
          // Optional: delete file after download
          // fs.unlinkSync(filePath);
        }
      });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
