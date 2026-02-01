import fetch from 'node-fetch';

/**
 * Universal AI provider that supports both Gemini and OpenRouter
 */
export async function callAI(prompt, options = {}) {
  const provider = process.env.AI_PROVIDER || 'gemini';

  if (provider === 'openrouter') {
    return await callOpenRouter(prompt, options);
  } else {
    return await callGemini(prompt, options);
  }
}

/**
 * Call Gemini API
 */
async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  return generatedText;
}

/**
 * Call OpenRouter API (OpenAI-compatible format)
 */
async function callOpenRouter(prompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4-turbo-preview';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

  const response = await fetch(openRouterUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/yourusername/winter-racing-game', // Optional
      'X-Title': 'Winter Racing Game' // Optional
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 100,
      temperature: options.temperature || 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content?.trim() || '';

  return generatedText;
}
