---
title: Clipper - AI Gaming Stream & Viral Video Clipper
emoji: ⚡
colorFrom: purple
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# Clipper - AI Gaming Stream & Viral Video Clipper

High-density autonomous video extraction, live reaction capture, and creative subtitle rendering engine for YouTube Shorts, Instagram Reels, and TikTok.

## Features
- **Live Stream Capture & Radar**: Scans for active GTA 6 & gaming streams, measures live chat velocity and peak audio decibels, and auto-clips peak moments to 9:16 vertical video.
- **Turbo Multiprocessing Pipeline**: Extracts, transcribes, styles, and renders multiple viral gaming clips in parallel (under 2 minutes).
- **7 Trending Subtitle Styles**: Alex Hormozi Lime, MrBeast Hype, Fire & Flame Glow, Cyberpunk Neon, Highlighter Pill, TikTok Classic Yellow, and Minimalist.
- **Multilingual Transcription**: Hindi (हिंदी Devanagari), English, Hinglish, and Auto speech detection.
- **Ready-to-Push Queue**: In-browser 9:16 video player, 1-click MP4 download, and formatted ready-to-post metadata copy.

## Quick Free Cloud Deployment on Hugging Face Spaces (100% Free - 16 GB RAM)

Hugging Face Spaces provides **2 vCPUs and 16 GB RAM** on the free tier with free HTTPS hosting 24/7.

### Step 1: Create Space
1. Sign in to [Hugging Face](https://huggingface.co/) (free).
2. Go to **[huggingface.co/new-space](https://huggingface.co/new-space)**.
3. Choose a Space Name (e.g. `clipper-ai`).
4. Select **Docker** as the Space SDK (Blank template).
5. Choose **Public** or **Private** (Free CPU tier: 2 vCPU, 16 GB RAM).
6. Click **Create Space**.

### Step 2: Add Secrets
In your new Space, click **Settings** $\rightarrow$ **Variables and secrets** $\rightarrow$ **New secret**:
- Name: `GEMINI_API_KEY`
- Value: `<Your Google Gemini API Key>`
- *(Optional)* Name: `YOUTUBE_API_KEY`
- Value: `<Your YouTube Data API v3 Key>`

### Step 3: Push Code to Space
In your terminal, add your Hugging Face Space as a git remote and push:
```bash
git remote add space https://huggingface.co/spaces/<YOUR-USERNAME>/<YOUR-SPACE-NAME>
git add .
git commit -m "Deploy Clipper to Hugging Face Spaces Free Cloud"
git push space main
```

Your Space will automatically build the container and provide a live public HTTPS URL:
`https://huggingface.co/spaces/<YOUR-USERNAME>/<YOUR-SPACE-NAME>`
