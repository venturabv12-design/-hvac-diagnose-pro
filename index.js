'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── ENVIRONMENT ───────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV';

if (!ANTHROPIC_API_KEY) {
  console.error('FATAL: ANTHROPIC_API_KEY not set');
  process.exit(1);
}

// ── GLOBAL CONCURRENCY — crash prevention only, no user throttling ────────────
let globalActive = 0;
const MAX_GLOBAL = 100; // handle 100 simultaneous AI calls before queuing

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      // Retry on server-side errors only
      if ((res.status === 529 || res.status === 503) && i < retries) {
        await sleep(1000 * (i + 1));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h', etag: true, lastModified: true,
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api/'))
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} active=${globalActive}`);
  next();
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    aiReady: !!ANTHROPIC_API_KEY,
    ttsReady: !!ELEVENLABS_API_KEY,
    activeRequests: globalActive,
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
  });
});

// ── AI ────────────────────────────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  // Only reject if server is truly overwhelmed
  if (globalActive >= MAX_GLOBAL) {
    return res.status(503).json({ error: 'Server at capacity — please try again in a moment.' });
  }

  const { messages, system, max_tokens = 1024, use_search = false } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages required' });

  globalActive++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const body = {
      model: 'claude-sonnet-4-5',
      max_tokens: Math.min(max_tokens, 2048),
      system,
      messages,
    };
    if (use_search) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    }

    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `API error ${response.status}`;
      console.error('Anthropic error:', response.status, msg);
      // Pass Anthropic's rate limit back to client
      return res.status(response.status === 429 ? 429 : 502).json({ error: msg });
    }

    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    res.json({ response: text || 'No response.' });

  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Request timed out — please try again.' });
    } else {
      console.error('AI error:', err.message);
      res.status(502).json({ error: 'Connection error — please try again.' });
    }
  } finally {
    clearTimeout(timeout);
    globalActive = Math.max(0, globalActive - 1);
  }
});

// ── TTS ───────────────────────────────────────────────────────────────────────
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
  if (!ELEVENLABS_API_KEY) return res.status(503).json({ error: 'TTS not configured' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.substring(0, 5000),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.50,
            similarity_boost: 0.80,
            style: 0.20,
            use_speaker_boost: true,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.warn('ElevenLabs error:', response.status, err.substring(0, 100));
      return res.status(502).json({ error: 'TTS failed' });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (audioBuffer.length < 500) return res.status(502).json({ error: 'Empty audio response' });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-store',
    });
    res.send(audioBuffer);

  } catch (err) {
    if (err.name === 'AbortError') res.status(504).json({ error: 'TTS timed out' });
    else { console.error('TTS error:', err.message); res.status(502).json({ error: 'TTS unavailable' }); }
  } finally {
    clearTimeout(timeout);
  }
});

// ── SPA FALLBACK ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── NEVER CRASH ───────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — staying alive:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION — staying alive:', reason);
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`HVAC Diagnose Pro running on port ${PORT}`);
  console.log(`AI: ${ANTHROPIC_API_KEY ? 'ready' : 'MISSING'} | TTS: ${ELEVENLABS_API_KEY ? 'ready' : 'not set'}`);
  console.log(`Max global concurrent: ${MAX_GLOBAL} — no per-user limits`);
});
