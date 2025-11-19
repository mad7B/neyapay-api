export default async function handler(req, res) {
  // CORS Ayarları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ cevap: "Sadece POST isteği kabul edilir." });
  }

  const body = req.body || {};
  const prompt = body.prompt || "Merhaba";

  // *************** 1 - GROQ ***************
  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 600
      })
    });

    const groqData = await groqResponse.json();

    if (groqData?.choices?.[0]?.message?.content) {
      return res.status(200).json({
        cevap: groqData.choices[0].message.content.trim()
      });
    }
  } catch (error) {
    console.log("GROQ ERROR:", error);
  }

  // *************** 2 - OPENROUTER FALLBACK (GARANTİ MODEL) ***************
  try {
    const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
        "HTTP-Referer": "https://neyapay.com.tr",
        "X-Title": "Neyapay",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.6-sonnet",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const orData = await orResponse.json();

    if (orData?.choices?.[0]?.message?.content) {
      return res.status(200).json({
        cevap: orData.choices[0].message.content.trim()
      });
    }

    if (orData?.error?.message) {
      return res.status(200).json({
        cevap: "Hata: " + orData.error.message
      });
    }

    return res.status(200).json({ cevap: "Yanıt alınamadı (OR fallback)." });

  } catch (error2) {
    console.log("OPENROUTER ERROR:", error2);
    return res.status(200).json({
      cevap: "AI şu an meşgul, birazdan tekrar dene."
    });
  }
}
