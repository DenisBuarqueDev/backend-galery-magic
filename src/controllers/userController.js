const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

/**
 * @desc    Criar um novo usuário
 * @route   POST /api/users
 * @access  Público (ou restrito, dependendo do caso)
 */
const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => e.msg),
    });
  }

  try {
    const { firstName, email, password } = req.body;

    // 🔎 Verifica duplicidade de e-mail
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "E-mail já cadastrado!",
      });
    }

    // 🔐 Criptografa senha
    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    // 🧠 Cria o usuário
    const user = await User.create({
      firstName: firstName.trim(),
      email: email.trim(),
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso!",
      data: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Erro em createUser:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao criar usuário!",
    });
  }
};

/**
 * @desc    Listar todos os usuários
 * @route   GET /api/users
 * @access  Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("❌ Erro em getUsers:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar usuários!",
    });
  }
};

/**
 * @desc    Buscar usuário por ID
 * @route   GET /api/users/:id
 * @access  Protegido (ou admin)
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado!",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Erro em getUserById:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar usuário!",
    });
  }
};

/**
 * @desc    Atualizar dados do usuário
 * @route   PUT /api/users/:id
 * @access  Protegido
 */
const updateUser = async (req, res) => {
  try {
    const { firstName, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado!",
      });
    }

    if (firstName) user.firstName = firstName.trim();

    if (password) {
      const hashed = await bcrypt.hash(password.trim(), 12);
      user.password = hashed;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Usuário atualizado com sucesso!",
      data: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Erro em updateUser:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar usuário!",
    });
  }
};

/**
 * @desc    Deletar usuário
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado!",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "Usuário removido com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro em deleteUser:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao remover usuário!",
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
