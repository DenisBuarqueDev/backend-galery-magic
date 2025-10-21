const Letter = require("../models/Letter");
const { validationResult } = require("express-validator");

/**
 * Cria um novo letra
 */
const createLetter = async (req, res) => {
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

    const { letter } = req.body;
    if (!letter?.trim()) {
      return res.status(400).json({ message: "A letra é obrigatório!" });
    }

    const letra = await Letter.create({
      letter: letter.trim(),
    });

    return res.status(201).json({
      message: "Letra criada com sucesso!",
      data: letra,
    });
  } catch (err) {
    console.error("❌ Erro createLetter:", err);
    return res.status(500).json({ error: "Erro interno ao criar letra." });
  }
};

/**
 * Lista todos os letras do alfabeto
 */
const getLetters = async (req, res) => {
  try {
    const letters = await Letter.find().sort({ createdAt: +1 }); // ordem recente primeiro
    return res.status(200).json({
      message: "Letras listados com sucesso!",
      data: letters,
    });
  } catch (err) {
    console.error("❌ Erro getLetters:", err);
    return res.status(500).json({ error: "Erro interno ao listar letras." });
  }
};


module.exports = {
  createLetter,
  getLetters,
};
