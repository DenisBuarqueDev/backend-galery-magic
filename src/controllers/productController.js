const Product = require("../models/Product");
const Category = require("../models/Category"); // importe o model
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const { validationResult } = require("express-validator");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

// 🔥 Nova API do Google GenAI (APENAS ELA)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Cria um novo produto (imagem e som hospedados no Cloudinary)
 */
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors
          .array()
          .map((e) => e.msg)
          .join(", "),
      });
    }

    const {
      title,
      english,
      espanhol,
      italiano,
      frances,
      sound,
      categoryId,
      syllable,
      isActive,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "O título é obrigatório!" });
    }
    if (!english?.trim()) {
      return res
        .status(400)
        .json({ message: "O título em inglês é obrigatório!" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
        resource_type: "image",
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;

      fs.unlink(req.file.path, () => {});
    }

    const product = await Product.create({
      title: title.trim(),
      english: english.trim(),
      espanhol: espanhol.trim(),
      italiano: italiano.trim(),
      frances: frances.trim(),
      image: imageUrl,
      imagePublicId,
      sound: sound?.trim() || "",
      categoryId: categoryId || null,
      syllable: syllable?.trim() || "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      message: "Produto criado com sucesso!",
      data: product,
    });
  } catch (err) {
    console.error("❌ Erro ao criar produto:", err);
    return res.status(500).json({ error: "Erro interno ao criar produto." });
  }
};

/**
 * Lista todos os produtos aleatórios (até 300)
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([{ $sample: { size: 300 } }]);

    await Product.populate(products, { path: "categoryId", select: "name" });

    return res.status(200).json({
      message: "Produtos listados com sucesso!",
      data: products,
    });
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro interno ao listar produtos." });
  }
};

/**
 * Lista produtos filtrados por categoria
 */

const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const filter = { isActive: true };
    let sortOption = { createdAt: -1 }; // padrão DESC

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          message: `ID de Categoria inválido: ${categoryId}.`,
          data: [],
        });
      }

      const objectId = new mongoose.Types.ObjectId(categoryId);
      filter.categoryId = objectId;

      // 🔎 Busca categoria para verificar se é "numeros"
      const category = await Category.findById(objectId);

      if (category && category.name.toLowerCase() === "Numbers") {
        // 🔥 Ordenar por título ASC (1,2,3...)
        sortOption = { title: 1 };
      }
    }

    const products = await Product.find(filter)
      .populate("categoryId", "name icon")
      .sort(sortOption);

    return res.status(200).json({
      message: "Produtos listados com sucesso!",
      data: products,
    });
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro interno ao buscar produto." });
  }
};

/*const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = {};

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          message: `ID de Categoria inválido: ${categoryId}.`,
          data: [],
        });
      }
      filter.categoryId = categoryId;
    }

    const products = await Product.find(filter)
      .populate("categoryId", "name icon")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Produtos listados com sucesso!",
      data: products,
    });
  } catch (err) {
    if (err.name === "CastError") {
      console.error("CastError ao buscar produtos:", err);
      return res
        .status(400)
        .json({ error: "ID de recurso inválido (CastError)." });
    }

    console.error("Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro interno ao buscar produto." });
  }
};*/

/**
 * Retorna um produto pelo ID
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categoryId",
      "name"
    );

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    return res.status(200).json({
      message: "Produto encontrado com sucesso!",
      data: product,
    });
  } catch (err) {
    console.error("❌ Erro ao obter produto:", err);
    return res.status(500).json({ error: "Erro interno ao buscar produto." });
  }
};

/**
 * Atualiza um produto
 */
const updateProduct = async (req, res) => {
  try {
    const {
      title,
      english,
      espanhol,
      italiano,
      frances,
      sound,
      categoryId,
      syllable,
      isActive,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "O título é obrigatório!" });
    }
    if (!english?.trim()) {
      return res
        .status(400)
        .json({ message: "O título em inglês é obrigatório!" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado!" });
    }

    if (req.file && product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
        resource_type: "image",
      });

      product.image = uploadResult.secure_url;
      product.imagePublicId = uploadResult.public_id;

      fs.unlink(req.file.path, () => {});
    }

    product.title = title.trim();
    product.english = english.trim();
    product.espanhol = espanhol.trim();
    product.italiano = italiano.trim();
    product.frances = frances.trim();
    product.sound = sound?.trim() || "";
    product.categoryId = categoryId || null;
    product.syllable = syllable?.trim() || "";
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    const updated = await product.save();

    return res.status(200).json({
      message: "Produto atualizado com sucesso!",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Erro ao atualizar produto:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao atualizar produto." });
  }
};

/**
 * Exclui um produto
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado!" });
    }

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await Product.findByIdAndDelete(product._id);

    return res.status(200).json({ message: "Produto removido com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao remover produto:", err);
    return res.status(500).json({ error: "Erro interno ao remover produto." });
  }
};

/**
 * IA — Gera história infantil com Google GenAI
 */
let lastCall = 0;

const geminiCreateStory = async (req, res) => {
  // ⏱ Rate limit simples (3s)
  if (Date.now() - lastCall < 3000) {
    return res.status(429).json({
      message: "Espere 3 segundos antes de tentar novamente.",
    });
  }
  lastCall = Date.now();

  try {
    let { word, language } = req.body;

    if (!word || !word.trim()) {
      return res.status(400).json({
        message: "A palavra é obrigatória!",
      });
    }

    // 🌍 Normaliza idioma (en-US → en)
    language = (language || "pt").split("-")[0];

    // 🌍 Idiomas suportados
    const LANGUAGE_INSTRUCTIONS = {
      pt: "Escreva a história em português brasileiro.",
      en: "Write the story in English.",
      es: "Escribe la historia en español.",
      fr: "Écris l'histoire en français.",
      it: "Scrivi la storia in italiano.",
    };

    const languageInstruction =
      LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.pt;

    // 🧠 Prompt reforçado
    const prompt = `
${languageInstruction}

Crie uma história infantil com EXATAMENTE 3 FRASES.
Cada frase deve terminar com ponto final.

A história deve ser inspirada na palavra: "${word}"

Regras:
- Público: crianças de 4 a 10 anos
- Tom: mágico, educativo, positivo e gentil
- Linguagem simples e fácil de entender
- Não use emojis
- Não use títulos
- Não use listas
- Não ultrapasse três frases
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    return res.status(200).json({
      message: "História gerada com sucesso!",
      language,
      story: text,
    });
  } catch (err) {
    const statusCode = err?.response?.status || err?.status || 500;

    const errorMessage =
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Erro desconhecido ao gerar história.";

    console.error("❌ Erro detalhado Gemini:", {
      statusCode,
      errorMessage,
      raw: err?.response?.data || err,
    });

    // 🚫 Limite de quota / créditos
    if (statusCode === 429) {
      return res.status(429).json({
        error: "Limite de histórias atingido.",
        details:
          "Os créditos da IA acabaram ou o limite diário foi alcançado. Tente novamente mais tarde.",
      });
    }

    return res.status(500).json({
      error: "Erro interno ao gerar história.",
      details: errorMessage,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  deleteProduct,
  geminiCreateStory,
};
