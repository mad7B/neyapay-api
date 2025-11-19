import { Groq from "groq-sdk";
import OpenAI from "openai";

const groq = new Groq({ apiKey: process.env.GROQ_KEY });
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export default async function handler(req, res) {
  // CORS headers – BU KISIM ÇOK ÖNEMLİ!
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ cevap: "Sadece POST kabul ediyorum" });
  }

  const { prompt } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "qwen/qwen-2.5-72b-instruct",
      temperature: 0.9,
      max_tokens: 600,
    });
    return res.status(200).json({ cevap: completion.choices[0].message.content.trim() });
  } catch (error) {
    try {
      const completion = await openrouter.chat.completions.create({
        model: "google/gemini-flash-1.5",
        messages: [{ role: "user", content: prompt }],
      });
      return res.status(200).json({ cevap: completion.choices[0].message.content.trim() });
    } catch (e) {
      return res.status(200).json({ cevap: "AI biraz yoruldu, 5 saniye sonra tekrar dene 🚀" });
    }
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
