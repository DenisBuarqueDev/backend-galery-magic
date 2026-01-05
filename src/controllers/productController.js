const Product = require("../models/Product");
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
      console.error("❌ CastError ao buscar produtos:", err);
      return res
        .status(400)
        .json({ error: "ID de recurso inválido (CastError)." });
    }

    console.error("❌ Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro interno ao buscar produto." });
  }
};

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
    const { title, english, espanhol, italiano, frances, sound, categoryId, syllable, isActive } = req.body;

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
  if (Date.now() - lastCall < 3000) {
    return res
      .status(429)
      .json({ message: "Espere 3 segundos antes de tentar novamente." });
  }
  lastCall = Date.now();

  try {
    const { word } = req.body;
    if (!word?.trim()) {
      return res.status(400).json({ message: "A palavra é obrigatória!" });
    }

    const prompt = `
      Crie uma pequena história com exatamente três frases inspirada na palavra "${word}".
      A história deve ser fácil para crianças de 4 a 10 anos, com tom leve, mágico e positivo.
    `;

    const response = await ai.models.generateContent({
      //model: "gemini-2.5-pro",
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    return res.status(200).json({
      message: "História gerada com sucesso!",
      story: text,
    });
  } catch (err) {
    console.error("❌ Erro ao gerar história com IA:", err);
    return res.status(500).json({
      error: "Erro ao gerar história com IA.",
      details: err.message,
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
