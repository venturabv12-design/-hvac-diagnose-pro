const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
const publicDir = path.join(__dirname, "public");


app.post("/api/ai", async (req, res) => {
  const { system, messages, max_tokens = 1024 } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:model: "claude-sonnet-4-5",

        max_tokens,
        system: system || "",
        messages,
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ text: data.content?.map(b => b.text || "").join("") || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiReady: !!process.env.ANTHROPIC_API_KEY });
});

app.get("*", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
