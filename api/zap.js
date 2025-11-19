export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  const method = req.method;

  // CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (method !== "POST") {
    return new Response(
      JSON.stringify({ cevap: "Sadece POST isteği kabul edilir." }),
      { status: 405, headers }
    );
  }

  const body = await req.json();
  const prompt = body.prompt || "Merhaba";

  // ---- GROQ ----
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
      return new Response(
        JSON.stringify({ cevap: groqData.choices[0].message.content.trim() }),
        { status: 200, headers }
      );
    }
  } catch (err) {
    console.log("GROQ ERROR:", err);
  }

  // ---- OPENROUTER FALLBACK ----
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

    if (orData?.choices?.[0]?.message?.content) {
      return new Response(
        JSON.stringify({ cevap: orData.choices[0].message.content.trim() }),
        { status: 200, headers }
      );
    }

    if (orData?.error?.message) {
      return new Response(
        JSON.stringify({ cevap: "Hata: " + orData.error.message }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ cevap: "Yanıt alınamadı (OR fallback)." }),
      { status: 200, headers }
    );
  } catch (err2) {
    console.log("OPENROUTER ERROR:", err2);
    return new Response(
      JSON.stringify({ cevap: "AI şu an meşgul, birazdan tekrar dene." }),
      { status: 200, headers }
    );
  }
}
