# OpenRouter Setup Guide

## What is OpenRouter?

OpenRouter is a unified API gateway that provides access to multiple AI models (GPT-4, Claude, Gemini, etc.) through a single API. Your $10 credit on OpenRouter can be used instead of the Gemini API.

## Important: Two API Keys Required

**OpenRouter ONLY replaces Gemini (text generation).**
**You still need ElevenLabs for voice/TTS.**

You need:
1. ✅ **OpenRouter API Key** - for AI coaching ($10 credit)
2. ✅ **ElevenLabs API Key** - for coach voices (free tier: 10k chars/month)

## Setup Steps

### 1. Get Your API Keys

**OpenRouter:**
- Go to https://openrouter.ai/
- Sign in and go to Keys section
- Copy your API key

**ElevenLabs:**
- Go to https://elevenlabs.io/
- Sign up for free tier
- Go to Profile → API Keys
- Copy your API key

### 2. Configure Environment Variables

Edit `server/.env`:

```bash
# Choose AI Provider
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=openai/gpt-4-turbo-preview

# ElevenLabs (Required for voice)
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Port
PORT=3001
```

### 3. Choose Your Model

OpenRouter supports many models. Update `OPENROUTER_MODEL` to your preference:

**Budget-friendly:**
- `openai/gpt-3.5-turbo` - Fast and cheap
- `anthropic/claude-instant-v1` - Anthropic's fast model
- `google/gemini-pro` - Gemini via OpenRouter

**Best quality:**
- `openai/gpt-4-turbo-preview` - Latest GPT-4
- `anthropic/claude-3-opus` - Best Claude model
- `anthropic/claude-3-sonnet` - Balanced Claude model

See full list: https://openrouter.ai/models

### 4. Start the Server

```bash
cd server
npm install
npm start
```

The server will now use OpenRouter instead of Gemini!

## Switching Back to Gemini

To switch back to Gemini, just change:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
```

## Cost Comparison

**OpenRouter** (your $10 credit):
- GPT-4 Turbo: ~$0.01 per 1k tokens
- GPT-3.5 Turbo: ~$0.002 per 1k tokens
- Your $10 = lots of races! (thousands)

**ElevenLabs** (free tier):
- 10,000 characters/month
- Each coaching tip ~20-50 chars
- ~200-500 tips per month

## Troubleshooting

**"OPENROUTER_API_KEY not configured"**
- Make sure `server/.env` exists and has your key
- Restart the server after changing `.env`

**"Failed to get coaching tip"**
- Check your OpenRouter balance: https://openrouter.ai/credits
- Try switching to a cheaper model like `openai/gpt-3.5-turbo`

**Voice not working**
- ElevenLabs is separate! Make sure `ELEVENLABS_API_KEY` is set
- Check your ElevenLabs quota: https://elevenlabs.io/app/usage
