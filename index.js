const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ aiReady: !!process.env.ANTHROPIC_API_KEY, ttsReady: !!process.env.ELEVENLABS_API_KEY });
});

app.post('/api/ai', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: req.body.max_tokens || 4096,
        system: req.body.system || '',
        messages: req.body.messages || []
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error });
    const text = data.content?.map(b => b.text || '').join('');
    res.json({ text });
  } catch (e) {
    if (e.name === 'AbortError') return res.status(504).json({ error: 'Request timed out' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tts', async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV';
  if (!key) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not set' });
  const text = (req.body.text || '').substring(0, 800);
  if (!text) return res.status(400).json({ error: 'No text provided' });
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': key
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.80,
            style: 0.20,
            use_speaker_boost: true
          }
        })
      }
    );
    if (!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs error:', response.status, err);
      return res.status(response.status).json({ error: err });
    }
    // Collect the full audio buffer before sending — prevents choppy decoding
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`ElevenLabs key set: ${!!process.env.ELEVENLABS_API_KEY}`);
  console.log(`Voice ID: ${process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV (default)'}`);
});
