// services/storyService.js
const queue = require("../utils/queue");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const generateWithRetry = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (err) {
    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "";

    if (retries > 0 && msg.toLowerCase().includes("demand")) {
      console.log("🔁 Retry IA...", 4 - retries);
      await sleep(1500);
      return generateWithRetry(fn, retries - 1);
    }

    throw err;
  }
};

const fallbackStory = (word, language) => {
  const stories = {
    pt: `Era uma vez ${word}, que vivia uma aventura mágica todos os dias. Ele aprendeu algo muito importante sobre amizade. E assim, viveu momentos felizes para sempre.`,
    en: `Once upon a time, ${word} lived magical adventures every day. It learned something very important about friendship. And so, it lived happily ever after.`,
  };

  return stories[language] || stories.pt;
};

const generateStoryService = async (ai, prompt, word, language) => {
  return queue.add(async () => {
    try {
      const result = await generateWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = response.text?.trim();

        if (!text) throw new Error("Resposta vazia");

        return text;
      });

      return {
        success: true,
        story: result,
      };
    } catch (err) {
      console.log("⚠️ Usando fallback");

      return {
        success: false,
        story: fallbackStory(word, language),
      };
    }
  });
};

module.exports = { generateStoryService };