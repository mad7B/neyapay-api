import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const OPENROUTER_API_KEY = "SENİN_API_KEYİN";

// 🌟 Her zaman düzgün çalışan ilk tercih model
const PRIMARY_MODEL = "meta-llama/llama-3.2-3b-instruct";

// 🌟 Birincisi hata verirse devreye giren yedek model
const FALLBACK_MODEL = "mistralai/mistral-small-latest";

async function generateAnswer(prompt) {
  const systemPrompt = "Kısa, düzgün, anlamlı ve akıcı Türkçe cevap üret. 3-4 cümleyi geçme.";

  // ---- 1) PRIMARY MODEL ----
  const primaryResponse = await callModel(PRIMARY_MODEL, prompt, systemPrompt);

  if (primaryResponse.ok) return primaryResponse;

  console.log("⚠ Primary model hata verdi, fallback'e geçiliyor...");

  // ---- 2) FALLBACK MODEL ----
  return await callModel(FALLBACK_MODEL, prompt, systemPrompt);
}

async function callModel(model, prompt, systemPrompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return { ok: false, error: "Model response empty" };
    }

    return {
      ok: true,
      text: data.choices[0].message.content.trim()
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt gerekli" });

  const ai = await generateAnswer(prompt);

  if (!ai.ok) {
    return res.status(500).json({ error: "AI cevap veremedi", detail: ai.error });
  }

  res.json({ answer: ai.text });
});

app.listen(3000, () => {
  console.log("Server çalışıyor: http://localhost:3000");
});
