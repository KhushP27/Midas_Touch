# Winter Racing - Robot Car Olympics

A Winter Olympics-themed 3D racing game built with Three.js and Vite, featuring AI-powered coaching and voice announcements.

## Features

- **Low-poly winter aesthetics** with snow particles and icy colors
- **Arcade-style driving** with WASD/Arrow key controls
- **Magnet pickup system** with animated robot arm
- **Target shooting mini-game** with charge mechanic
- **AI Coach** powered by Google Gemini that analyzes your performance
- **Voice announcements** using ElevenLabs text-to-speech
- **Complete game loop**: Garage → Track → Shooting Range → Results

## Tech Stack

- **Frontend**: Vite + Three.js (vanilla JavaScript)
- **Backend**: Node.js + Express (API proxy for secure key management)
- **AI Integration**:
  - Google Gemini API for post-race coaching tips
  - ElevenLabs API for voice announcements

## Project Structure

```
winter-racing-game/
├── client/                # Vite frontend application
│   ├── src/
│   │   ├── game/         # Three.js scene and track
│   │   ├── systems/      # Game systems (physics, input, etc.)
│   │   ├── ui/           # UI management
│   │   └── main.js       # Entry point
│   ├── index.html        # Main HTML with embedded styles
│   └── package.json
├── server/               # Express API proxy server
│   ├── index.js         # Server with Gemini & ElevenLabs endpoints
│   └── package.json
└── .env.example         # Environment variables template
```

## Setup Instructions

### 1. Get API Keys

You'll need API keys for the AI features:

1. **Google Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Reference: [Gemini API Text Generation Docs](https://ai.google.dev/gemini-api/docs/text-generation)

2. **ElevenLabs API Key**
   - Visit: https://elevenlabs.io/
   - Sign up and get your API key from the profile section
   - Reference: [ElevenLabs TTS API Docs](https://elevenlabs.io/docs/api-reference/text-to-speech)

### 2. Install Dependencies

#### Server Setup
```bash
cd server
npm install
```

#### Client Setup
```bash
cd client
npm install
```

### 3. Configure Environment Variables

#### Server Configuration

Create `server/.env` from the example:
```bash
cd server
cp ../.env.example .env
```

Edit `server/.env` and add your API keys:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
PORT=3001
```

#### Client Configuration

Create `client/.env`:
```bash
cd client
cp .env.example .env
```

The default configuration should work:
```env
VITE_API_BASE=http://localhost:3001
```

### 4. Run the Game

You'll need **two terminal windows**:

#### Terminal 1: Start the API Server
```bash
cd server
npm start
```

You should see:
```
🚀 Winter Racing API Server running on port 3001
📡 Health check: http://localhost:3001/health
```

#### Terminal 2: Start the Game Client
```bash
cd client
npm run dev
```

Vite will open your browser automatically to `http://localhost:5173`

## How to Play

### Controls
- **W / Up Arrow** - Accelerate
- **S / Down Arrow** - Brake/Reverse
- **A / Left Arrow** - Turn left
- **D / Right Arrow** - Turn right
- **SPACE** - Charge shot (when holding ball at target platform)

### Game Flow

1. **Garage Screen**
   - Choose your car color
   - Select wheel type (cosmetic)
   - Click "Start Race!"

2. **Main Track**
   - Drive forward and pick up the yellow box
   - Deliver it to the blue circle (drive slowly near it)
   - Gate will unlock automatically

3. **Shooting Range**
   - Drive through the unlocked gate
   - Pick up the red ball
   - Position yourself on the target platform
   - Hold SPACE to charge your shot
   - Release to shoot at the target (aim for the center!)

4. **Return to Finish**
   - Drive back to the green finish line near the starting area

5. **Results Screen**
   - See your time, score, and collision count
   - Get 3 AI-powered coaching tips from Gemini

### Scoring

- **Box Delivery**: +10 points
- **Shooting Accuracy**:
  - Bullseye (inner circle): +20 points
  - Middle ring: +10 points
  - Outer ring: +5 points
- **Completion**: +15 points
- **Time Bonus**:
  - Under 60s: +30 points
  - Under 90s: +20 points
  - Under 120s: +10 points

## API Endpoints

### Server Endpoints

The Express server provides secure API proxies:

#### POST `/api/gemini/coach`
Analyzes race performance and returns coaching tips.

**Request:**
```json
{
  "stats": {
    "timeMs": 65000,
    "score": 85,
    "collisions": 2,
    "sections": ["box-picked", "box-delivered", "target-shot", "finish-reached"]
  }
}
```

**Response:**
```json
{
  "tips": [
    "Practice smoother turns to reduce collisions",
    "Charge shots fully for better accuracy",
    "Maintain steady speed through obstacles"
  ]
}
```

**Implementation Details:**
- Uses Gemini 2.0 Flash model via `generateContent` endpoint
- Sends `x-goog-api-key` header for authentication
- Reference: https://ai.google.dev/gemini-api/docs/text-generation

#### POST `/api/tts`
Converts text to speech for announcements.

**Request:**
```json
{
  "text": "Ready... Go!"
}
```

**Response:**
- Audio file (audio/mpeg)

**Implementation Details:**
- Uses ElevenLabs voice ID: `21m00Tcm4TlvDq8ikWAM` (Rachel)
- Sends `xi-api-key` header for authentication
- Reference: https://elevenlabs.io/docs/api-reference/text-to-speech

## Development

### Building for Production

```bash
cd client
npm run build
```

This creates an optimized build in `client/dist/`.

### Preview Production Build

```bash
cd client
npm run preview
```

## Troubleshooting

### "AI coach not working"
- Check that `GEMINI_API_KEY` is set in `server/.env`
- Verify the server is running on port 3001
- Check the browser console for errors
- Fallback tips will be shown if the API fails

### "Voice announcements not playing"
- Check that `ELEVENLABS_API_KEY` is set in `server/.env`
- Verify the server is running
- Browser may block autoplay - try interacting with the page first
- Game will work silently if TTS is unavailable

### "Port already in use"
- Change `PORT` in `server/.env` (default: 3001)
- Update `VITE_API_BASE` in `client/.env` to match
- For client, change port in `client/vite.config.js`

### "Can't pick up items"
- Slow down near items (speed must be < 2)
- Get close enough (within 3 units)
- Make sure you're not already holding something

## Architecture Notes

### API Key Security
- **IMPORTANT**: API keys are NEVER exposed to the client
- All API calls go through the Express proxy server
- Client only knows the server URL (VITE_API_BASE)
- Server reads keys from environment variables only

### Three.js Setup
- Uses ES6 imports: `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'`
- Simple physics: raycasting for ground, AABB for pickups
- Camera follows vehicle with smooth lerp
- Shadow mapping enabled for realistic lighting

### Game Systems
- **InputManager**: Keyboard input handling
- **PhysicsManager**: Ground detection and collisions
- **PickupManager**: Item attachment and delivery
- **ShootingManager**: Charge mechanic and trajectory
- **ScoringManager**: Points and objectives tracking
- **AudioManager**: Web Audio API + TTS integration
- **SnowParticles**: Particle system for ambiance

## Credits

- Built with [Three.js](https://threejs.org/)
- Powered by [Vite](https://vitejs.dev/)
- AI by [Google Gemini](https://ai.google.dev/)
- Voice by [ElevenLabs](https://elevenlabs.io/)

## License

MIT License - Feel free to modify and use for your own projects!

---

**Enjoy the race! 🏎️❄️**
