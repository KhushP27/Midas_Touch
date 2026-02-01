import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getCoachConfig } from './coachConfig.js';
import { callAI } from './aiProvider.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gemini AI Coach Endpoint
// Uses Google Gemini API with x-goog-api-key header
// Reference: https://ai.google.dev/gemini-api/docs/text-generation
app.post('/api/gemini/coach', async (req, res) => {
  try {
    const { stats, coachPersonality } = req.body;

    console.log('📊 Received coach request with stats:', stats);

    const { timeMs, score, collisions, sections } = stats;

    // Get coach personality config
    const coachConfig = getCoachConfig(coachPersonality || 'motivational');
    console.log(`🎙️ Using ${coachConfig.name} coaching style for post-race tips`);

    // Craft a prompt for the AI coach with personality
    const prompt = `${coachConfig.promptModifier}

Analyze this race performance and provide exactly 3 short, actionable tips (each under 20 words):

Time: ${(timeMs / 1000).toFixed(1)}s
Score: ${score}
Collisions: ${collisions}
Sections Completed: ${sections.join(', ')}

Focus on: speed optimization, collision avoidance, and scoring improvements.
Format: Return only 3 tips, one per line, no numbering.`;

    // Call AI provider (Gemini or OpenRouter)
    const generatedText = await callAI(prompt);
    console.log('📄 Generated text:', generatedText);

    const tips = generatedText
      .split('\n')
      .map(tip => tip.trim())
      .filter(tip => tip.length > 0)
      .slice(0, 3);

    console.log('✅ Extracted tips:', tips);

    // Fallback tips if API fails
    if (tips.length === 0) {
      console.warn('⚠️ No tips generated, using fallback');
      return res.json({
        tips: [
          'Practice smoother turns to reduce collisions',
          'Focus on pickup timing to save seconds',
          'Charge your shots carefully for better accuracy'
        ]
      });
    }

    console.log('✅ Sending tips to client:', tips);
    res.json({ tips });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      error: 'Failed to get coach tips',
      tips: [
        'Keep practicing to improve your time',
        'Avoid obstacles for a higher score',
        'Master the charge mechanic for better shots'
      ]
    });
  }
});

// Real-time AI Coach Endpoint (during race)
app.post('/api/gemini/realtime-coach', async (req, res) => {
  try {
    const { context } = req.body;

    console.log('🎓 Received real-time coaching request:', context);

    const { event, zone, speed, avgSpeed, collisions, recentCollisions, objective, ballInFlight, hasShot, coachPersonality } = context;

    // Don't give shooting advice if ball is in flight or already shot
    if ((ballInFlight || hasShot) && objective && objective.includes('shoot')) {
      const tips = [
        'Head to the finish line now!',
        'Great shot! Find the finish!',
        'Time to wrap this up!',
        'Sprint to the green platform!',
        'Nice work! Head to finish!'
      ];
      return res.json({ tip: tips[Math.floor(Math.random() * tips.length)] });
    }

    // Get coach personality config
    const coachConfig = getCoachConfig(coachPersonality || 'motivational');
    console.log(`🎙️ Using ${coachConfig.name} coaching style`);

    // Craft a contextual prompt based on the event with personality modifier
    let prompt = `${coachConfig.promptModifier}\n\nThe player is currently driving. `;

    switch (event) {
      case 'zone-change':
        prompt += `They just entered the "${zone}" zone. `;
        break;
      case 'multiple-collisions':
        prompt += `They've hit ${recentCollisions} obstacles recently. `;
        break;
      case 'low-speed':
        prompt += `Their average speed is low (${Math.floor(avgSpeed)} km/h) in an open area. `;
        break;
      case 'high-speed-obstacles':
        prompt += `They're going very fast (${Math.floor(speed)} km/h) in an area with obstacles. `;
        break;
      case 'approaching-junction':
        prompt += `They're approaching a path split. `;
        break;
      case 'slow-progress':
        prompt += `They're moving slowly (${Math.floor(avgSpeed)} km/h) on the path. `;
        break;
      case 'good-pace':
        prompt += `They're maintaining good speed (${Math.floor(avgSpeed)} km/h) with no collisions! `;
        break;
      case 'periodic-check':
        prompt += `Give them a motivational tip based on their current performance. `;
        break;
      default:
        prompt += `Event: ${event}. `;
    }

    prompt += `Current speed: ${Math.floor(speed)} km/h. Total collisions: ${collisions}. `;

    // Add explicit instruction if ball has been shot
    if (hasShot) {
      prompt += `\nIMPORTANT: The player has ALREADY shot the ball. Do NOT mention shooting or the ball. `;
    } else if (ballInFlight) {
      prompt += `\nIMPORTANT: The ball is currently in flight. Do NOT mention shooting. `;
    }

    prompt += `\n\nProvide ONE coaching tip. Keep it punchy and actionable. Use 1-2 sentences. No extra commentary. DO NOT just say "focus on your objective".`;

    console.log('📝 Coaching prompt:', prompt);

    // Call AI provider (Gemini or OpenRouter)
    const tip = await callAI(prompt, { maxTokens: 80, temperature: 0.6 });

    console.log('💬 Generated coaching tip:', tip);

    // Fallback tips if API fails
    if (!tip) {
      console.warn('⚠️ No tip generated, using fallback');
      const fallbackTips = {
        'zone-change': 'Stay focused on the road ahead!',
        'multiple-collisions': 'Slow down and steer carefully!',
        'low-speed': 'Speed up! Floor it!',
        'high-speed-obstacles': 'Careful! Obstacles ahead!',
        'approaching-junction': 'Choose your path wisely!',
        'slow-progress': 'Pick up the pace!',
        'good-pace': 'Great driving! Keep it up!',
        'periodic-check': 'You\'re doing great! Stay focused!'
      };
      return res.json({ tip: fallbackTips[event] || 'Keep going!' });
    }

    const cleanedTip = tip
      .trim()
      .replace(/["""]/g, '');

    res.json({ tip: cleanedTip || tip });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      error: 'Failed to get coaching tip',
      tip: 'Keep racing!'
    });
  }
});

// AI Theme Generator Endpoint
// Uses Gemini to generate car color themes from keywords
app.post('/api/gemini/generate-theme', async (req, res) => {
  try {
    const { keywords } = req.body;

    console.log('🎨 Received theme generation request for:', keywords);

    const prompt = `You are a car theme designer. Based on the keywords "${keywords}", generate a vibrant hex color code for a racing car.

CRITICAL: You must respond with ONLY a 6-character hex color code starting with # (example: #ff5733)
- No explanations, no additional text
- Must start with # followed by exactly 6 hexadecimal characters
- Make it vibrant and match the theme/mood

Keywords: ${keywords}

Hex color code:`;

    // Call AI provider (Gemini or OpenRouter)
    const generatedText = await callAI(prompt);

    console.log('🎨 Generated theme text:', generatedText);

    // Extract hex color from response (look for #xxxxxx pattern)
    const hexMatch = generatedText.match(/#?([0-9a-fA-F]{6})/);
    let color = hexMatch ? `#${hexMatch[1]}` : '#ff4757'; // Default to red

    console.log('✅ Generated hex color:', color);

    res.json({ color });
  } catch (error) {
    console.error('Error generating theme:', error);
    res.status(500).json({
      error: 'Failed to generate theme',
      color: '#ff4757' // Return hex code, not named color
    });
  }
});

// ElevenLabs TTS Endpoint
// Uses ElevenLabs API with xi-api-key header
// Reference: https://elevenlabs.io/docs/api-reference/text-to-speech
app.post('/api/tts', async (req, res) => {
  try {
    const { text, coachPersonality } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
    }

    // Get voice ID based on coach personality
    const coachConfig = getCoachConfig(coachPersonality || 'motivational');
    const voiceId = coachConfig.voiceId;

    console.log(`🎙️ Using ${coachConfig.name} voice (${voiceId}) for TTS`);

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return res.status(500).json({ error: 'TTS request failed' });
    }

    // Stream audio bytes back to client
    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error calling ElevenLabs API:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Winter Racing API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set - AI coach will use fallback tips');
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn('⚠️  ELEVENLABS_API_KEY not set - TTS announcements will be disabled');
  }
});
