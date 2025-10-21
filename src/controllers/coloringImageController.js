const ColoringImage = require("../models/ColoringImage");
const { validationResult } = require("express-validator");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

/**
 * Cria um novo produto (imagem e som hospedados no Cloudinary)
 */
const createImage = async (req, res) => {
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

    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "O título é obrigatório!" });
    }

    let imageUrl = null;
    let imagePublicId = null;

    // Upload da imagem, se enviada
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "coloring-image",
        resource_type: "image",
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;

      fs.unlink(req.file.path, () => {}); // Remove arquivo temporário sem travar o fluxo
    }

    const character = await ColoringImage.create({
      title: title.trim(),
      image: imageUrl,
      imagePublicId,
    });

    return res.status(201).json({
      message: "Imagem criada com sucesso!",
      data: character,
    });
  } catch (err) {
    console.error("❌ Erro ao criar Imagem:", err);
    return res.status(500).json({ error: "Erro interno ao criar imagem." });
  }
};

/**
 * Lista todos os produtos
 */
const getAllImages = async (req, res) => {
  try {
    const characters = await ColoringImage.find().sort({ createdAt: -1 }); // ordem recente primeiro
    return res.status(200).json({
      message: "Imagens listados com sucesso!",
      data: characters,
    });
  } catch (err) {
    console.error("Erro ao listar imagens:", err);
    return res.status(500).json({ error: "Erro interno ao listar imagens." });
  }
};

/**
 * Retorna um produto pelo ID
 */
const getImageById = async (req, res) => {
  try {
    const character = await ColoringImage.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Imagem não encontrado." });
    }

    return res.status(200).json({
      message: "Imagem encontrado com sucesso!",
      data: character,
    });
  } catch (err) {
    console.error("❌ Erro ao obter imagem:", err);
    return res.status(500).json({ error: "Erro interno ao buscar imagem." });
  }
};

/**
 * Atualiza um produto existente
 */
const updateImage = async (req, res) => {
  try {
    const { title  } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "O título é obrigatório!" });
    }

    const product = await ColoringImage.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Imagem não encontrada!" });
    }

    // Remove imagem anterior, se houver e for substituída
    if (req.file && product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    // Faz upload da nova imagem, se enviada
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "coloring-image",
        resource_type: "image",
      });
      product.image = uploadResult.secure_url;
      product.imagePublicId = uploadResult.public_id;
      fs.unlink(req.file.path, () => {});
    }

    product.title = title.trim();

    const updated = await product.save();

    return res.status(200).json({
      message: "Imagem atualizado com sucesso!",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Erro ao atualizar imagem:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao atualizar imagem." });
  }
};

/**
 * Exclui um produto e remove sua imagem do Cloudinary
 */
const deleteImage = async (req, res) => {
  try {
    const character = await ColoringImage.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Imagem não encontrado!" });
    }

    if (character.imagePublicId) {
      await cloudinary.uploader.destroy(character.imagePublicId);
    }

    await ColoringImage.findByIdAndDelete(character._id);

    return res.status(200).json({ message: "Imagem removida com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao remover imagem:", err);
    return res.status(500).json({ error: "Erro interno ao remover imagem." });
  }
};


module.exports = {
  createImage,
  getAllImages,
  getImageById,
  updateImage,
  deleteImage,
};
