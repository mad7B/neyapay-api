export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ cevap: "Sadece POST" });

  const { prompt } = req.body || {};

  try {
    // 1. GROQ API
    const g = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages: [{ role: "user", content: prompt || "Merhaba" }],
        temperature: 0.9,
        max_tokens: 600
      })
    });

    const data = await g.json();

    if (data?.choices?.[0]?.message?.content) {
      return res.status(200).json({
        cevap: data.choices[0].message.content.trim()
      });
    }

    throw new Error("Groq failed");
  } catch (e) {
    try {
      // 2. OPENROUTER fallback
      const o = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
          "HTTP-Referer": "https://neyapay.com.tr",
          "X-Title": "Neyapay",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5",
          messages: [{ role: "user", content: prompt || "Merhaba" }]
        })
      });

      const data = await o.json();

      return res.status(200).json({
        cevap: data?.choices?.[0]?.message?.content?.trim() ||
               "Yanıt alınamadı ama API çalışıyor."
      });
    } catch (err) {
      return res.status(200).json({
        cevap: "AI dinleniyor, 5 saniye sonra tekrar dene 🚀"
      });
    }
  }
}
