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

  const body = req.body || {};
  const prompt = body.prompt || "Merhaba";

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

    throw new Error("Groq hata");
  } catch (error) {
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
          model: "google/gemini-flash-1.5",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const orData = await orResponse.json();

      return res.status(200).json({
        cevap:
          orData?.choices?.[0]?.message?.content?.trim() ||
          "Yanıt alınamadı."
      });
    } catch (error2) {
      return res.status(200).json({
        cevap: "AI şu an meşgul, birazdan tekrar dene."
      });
    }
  }
}
