import "dotenv/config";
import mongoose from "mongoose";
import OpenAI from "openai";
import Product from "../src/models/Product.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB conectado");
}

async function translateWord(word) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Você é um tradutor profissional. Traduza apenas palavras isoladas."
      },
      {
        role: "user",
        content: `Traduza a palavra "${word}" para:
        - Espanhol
        - Francês
        - Italiano

        Retorne APENAS JSON:
        {
          "espanhol": "",
          "frances": "",
          "italiano": ""
        }`
      }
    ],
    temperature: 0
  });

  return JSON.parse(response.choices[0].message.content);
}

async function run() {
  await connectDB();

  /*const products = await Product.find({
    title: { $exists: true, $ne: "" },
    $or: [
      { espanhol: "" },
      { frances: "" },
      { italiano: "" }
    ]
  });*/

  const products = await Product.find({
    title: { $exists: true, $ne: "" },
    $or: [
      { espanhol: "" },
      { frances: "" },
      { italiano: "" }
    ]
  }).limit(1);

  console.log(`🔎 ${products.length} produtos para traduzir`);

  for (const product of products) {
    try {
      const translations = await translateWord(product.title);

      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            espanhol: translations.espanhol,
            frances: translations.frances,
            italiano: translations.italiano
          }
        }
      );

      console.log(`✔ ${product.title}`);
    } catch (err) {
      console.error(`❌ Erro em "${product.title}"`, err.message);
    }
  }

  console.log("🎉 Tradução finalizada");
  process.exit(0);
}

run();
