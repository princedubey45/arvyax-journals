const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory cache to reduce LLM costs
const analysisCache = new Map();

async function analyzeEmotion(text) {
  // Check cache first (bonus: caching repeated analysis)
  const cacheKey = text.trim().toLowerCase();
  if (analysisCache.has(cacheKey)) {
    console.log('[LLM] Cache hit');
    return analysisCache.get(cacheKey);
  }

  const prompt = `You are an emotion analysis assistant for a nature wellness app.
Analyze the following journal entry and respond ONLY with a valid JSON object — no markdown, no explanation.

Journal entry: "${text}"

Respond with exactly this structure:
{
  "emotion": "<primary emotion in one word>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "summary": "<one sentence summary of the user's mental state>"
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = message.content[0].text.trim();

  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    // Fallback if JSON parse fails
    result = {
      emotion: 'neutral',
      keywords: [],
      summary: 'Unable to parse analysis result.'
    };
  }

  // Store in cache
  analysisCache.set(cacheKey, result);

  return result;
}

module.exports = { analyzeEmotion };
