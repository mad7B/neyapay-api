import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/", async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt) {
    return res.json({ cevap: "Prompt gelmedi!" });
  }

  // 1) Groq
  try {
    const g = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9
      })
    });

    if (g.ok) {
      const d = await g.json();
      return res.json({ cevap: d.choices[0].message.content });
    }
  } catch {}

  // 2) OpenRouter (Gemini)
  try {
    const o = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://neyapay.com.tr",
        "X-Title": "Neyapay API"
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9
      })
    });

    const d = await o.json();
    if (d.choices?.[0]?.message?.content)
      return res.json({ cevap: d.choices[0].message.content });
  } catch {}

  // 3) AIMLAPI fallback
  try {
    const a = await fetch("https://api.aimlapi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AIMLAPI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const d = await a.json();
    return res.json({ cevap: d.choices[0].message.content });
  } catch {}

  res.json({ cevap: "AI şu anda yavaş, tekrar dene" });
});

app.listen(3000, () => console.log("NEYAPAY API ÇALIŞIYOR 🚀"));
