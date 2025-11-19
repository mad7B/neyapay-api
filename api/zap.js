export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ cevap: "Sadece POST isteği kabul edilir." });
  }

  const prompt = req.body?.prompt || "Merhaba";

  // 1) GROQ
  try {
    const g = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.8
      })
    });

    const j = await g.json();

    if (j?.choices?.[0]?.message?.content) {
      return res.status(200).json({ cevap: j.choices[0].message.content.trim() });
    }
  } catch (err) {
    console.log("GROQ ERROR:", err);
  }

  // 2) OPENROUTER FALLBACK (her zaman çalışan model)
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
        "HTTP-Referer": "https://neyapay.com.tr",
        "X-Title": "Neyapay",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const d = await r.json();

    if (d?.choices?.[0]?.message?.content) {
      return res.status(200).json({ cevap: d.choices[0].message.content.trim() });
    }

    if (d?.error?.message) {
      return res.status(200).json({ cevap: "Hata: " + d.error.message });
    }
  } catch (err2) {
    console.log("OR ERROR:", err2);
  }

  return res.status(200).json({
    cevap: "Yanıt alınamadı, birazdan tekrar dene."
  });
}
