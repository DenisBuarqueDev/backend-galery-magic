const Product = require("../models/Product");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { validationResult } = require("express-validator");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const { title, english, sound } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "O título é obrigatório!" });
    }

    if (!english?.trim()) {
      return res.status(400).json({ message: "O título em inglês é obrigatório!" });
    }
    
    let imageUrl = null;
    let imagePublicId = null;

    // Upload da imagem, se enviada
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "products",
        resource_type: "image",
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;

      fs.unlink(req.file.path, () => {}); // Remove arquivo temporário sem travar o fluxo
    }

    const product = await Product.create({
      title: title.trim(),
      english: english.trim(),
      image: imageUrl,
      imagePublicId,
      sound: sound?.trim() || "",
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
 * Lista todos os produtos
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // ordem recente primeiro
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
 * Retorna um produto pelo ID
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
 * Atualiza um produto existente
 */
const updateProduct = async (req, res) => {
  try {
    const { title, english, sound } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "O título é obrigatório!" });
    }

    if (!english?.trim()) {
      return res.status(400).json({ message: "O título em inglês é obrigatório!" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado!" });
    }

    // Remove imagem anterior, se houver e for substituída
    if (req.file && product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    // Faz upload da nova imagem, se enviada
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
    product.sound = sound?.trim() || "";

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
 * Exclui um produto e remove sua imagem do Cloudinary
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
 * Gera uma história infantil usando IA (Google Gemini)
 */

const listModels = async (req, res) => {
  try {
    const models = await genAI.listModels();
    return res.json(models);
  } catch (err) {
    console.error("Erro ao listar modelos:", err);
    return res.status(500).json({ error: "Não foi possível listar modelos" });
  }
};

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
      A história deve ser envolvente, criativa e fácil de entender, adequada para crianças de 4 a 10 anos.
      Mantenha o tom leve, mágico e positivo.
    `;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    //const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text()?.trim();

    if (!text) {
      throw new Error("Falha ao gerar história com Gemini.");
    }

    return res.status(200).json({
      message: "História gerada com sucesso!",
      story: text,
    });
  } catch (err) {
    console.error("❌ Erro geminiCreateStory IA:", err);
    return res.status(500).json({
      error: "Erro ao gerar história com IA.",
      details: err.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  geminiCreateStory,
};
