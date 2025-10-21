const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// 🔐 Gerar token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { firstName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário já existe!" });
    }

    const user = await User.create({
      firstName,
      email,
      password,
    });

    const token = generateToken(user._id);

    // 🧠 Definir o cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: "/",
    });

    res.status(201).json({
      message: "Cadastro do usuário realizado com sucesso!",
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
      },
      token: token,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao cadastrar o usuário!" });
  }
};

// 🔐 Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const data = await User.findOne({ email }).select("+password"); // ✅ inclui o campo senha

    if (!data) {
      return res.status(404).json({ error: "Usuário não encontrado!" });
    }

    if (!data.comparePassword) {
      console.error("Método comparePassword não encontrado no modelo User");
      return res
        .status(500)
        .json({ error: "Erro interno ao autenticar usuário" });
    }

    const isMatch = await data.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Senha inválida!" });
    }

    const token = generateToken(data._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: "/",
    });

    res.status(200).json({
      message: "Usuário conectado!",
      user: {
        _id: data._id,
        firstName: data.firstName,
        email: data.email,
      },
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao realizar o login!" });
  }
};

// 🙋 Obter usuário atual (usando middleware para decodificar token)
const getCurrentUser = async (req, res) => {
  /*try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao obter usuário!" });
  }*/

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token ausente" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.status(403).json({ message: "Token inválido" });
  }
};

// 🚪 Logout
const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    return res.status(200).json({ message: "Usuário desconectado!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao realizar o logout!" });
  }
};

// Buscar dados do usuário pelo ID
const getUserById = async (req, res) => {
  try {
    // req.user.id vem do middleware de autenticação
    const data = await User.findById(req.user.id).select("-password");

    if (!data) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Erro em /api/auth/me:", error);
    return res.status(500).json({ message: "Erro ao buscar usuário atual" });
  }
};

module.exports = { register, login, logoutUser, getCurrentUser, getUserById };
