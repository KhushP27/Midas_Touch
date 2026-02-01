# Quick Start Guide

Get the game running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- API keys (optional, game works with fallbacks)

## Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 2: Add API Keys (Optional)

Edit `server/.env` and add your keys:

```env
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

**Don't have keys?** The game works without them! You'll get:
- Fallback AI tips instead of Gemini coaching
- Silent announcements instead of voice

Get keys:
- Gemini: https://makersuite.google.com/app/apikey
- ElevenLabs: https://elevenlabs.io/

## Step 3: Run the Game

Open **TWO terminals**:

**Terminal 1 - Server:**
```bash
cd server
npm start
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

## Step 4: Play!

The game opens automatically at http://localhost:5173

### Controls
- **WASD** or **Arrow Keys** - Drive
- **SPACE** - Charge shot (at target platform)

### Objectives
1. Pick up yellow box
2. Deliver to blue circle
3. Drive through unlocked gate
4. Pick up red ball and shoot at target
5. Return to green finish line

**That's it! Enjoy the race! 🏎️❄️**
