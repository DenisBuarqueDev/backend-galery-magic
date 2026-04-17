const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/* ================= GEMINI ================= */
const generateWithGemini = async (ai, prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash", // 🔥 mais estável
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return response.text?.trim();
};

/* ================= OPENAI ================= */
const generateWithOpenAI = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim();
};

/* ================= FALLBACK ================= */
const fallbackStory = (word, language) => {
  const stories = {
    pt: `Era uma vez ${word}, que vivia uma aventura mágica todos os dias. Ele aprendeu algo muito importante sobre amizade. E assim, viveu feliz para sempre.`,
    en: `Once upon a time, ${word} lived magical adventures every day. It learned something important about friendship. And lived happily ever after.`,
  };

  return stories[language] || stories.pt;
};

/* ================= MULTI AI ================= */
const generateStoryMultiAI = async (ai, prompt, word, language) => {
  // 🔥 1. GEMINI (com retry)
  try {
    for (let i = 0; i < 2; i++) {
      try {
        const result = await generateWithGemini(ai, prompt);
        if (result) return { source: "gemini", story: result };
      } catch (err) {
        await sleep(1000);
      }
    }
  } catch (e) {}

  // 🔥 2. OPENAI
  try {
    const result = await generateWithOpenAI(prompt);
    if (result) return { source: "openai", story: result };
  } catch (e) {}

  // 🔥 3. FALLBACK FINAL
  return {
    source: "fallback",
    story: fallbackStory(word, language),
  };
};

module.exports = { generateStoryMultiAI };