const Store = require("../models/Store");
const User = require("../models/User"); // Modelo do usuário

/**
 * 📘 Salvar uma nova história
 */
/*const saveHistory = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { title, text } = req.body;

    // Validação básica
    if (!idUser || !title?.trim() || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes: título, texto ou usuário.",
      });
    }

    // 🔍 Verifica se o usuário existe
    const userExists = await User.findById(idUser);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    // Cria e salva a nova história
    const newHistory = await Store.create({ title, text, idUser });

    return res.status(201).json({
      success: true,
      message: "História salva com sucesso!",
      data: newHistory,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar história:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao salvar história.",
      error: error.message,
    });
  }
};*/

/**
 * 📘 Salvar uma única história combinando várias histórias do localStorage
 */
const saveHistory = async (req, res) => {
  try {
    const { idUser } = req.params;
    const { titles, texts } = req.body;

    // 🧩 Validação dos campos recebidos
    if (!idUser || !titles || !texts) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios ausentes: título, texto ou usuário.",
      });
    }

    // 👤 Verifica se o usuário existe
    const userExists = await User.findById(idUser);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    // 💾 Cria e salva a nova história combinada
    const newHistory = await Store.create({
      idUser,
      title: titles.trim(),
      text: texts.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "História combinada salva com sucesso!",
      data: newHistory,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar história combinada:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao salvar história combinada.",
      error: error.message,
    });
  }
};

/**
 * 📚 Listar todas as histórias de um usuário
 */
const getUserHistories = async (req, res) => {
  try {
    const { idUser } = req.params;

    if (!idUser) {
      return res.status(400).json({
        success: false,
        message: "O ID do usuário é obrigatório.",
      });
    }

    // Verifica se usuário existe
    const userExists = await User.findById(idUser);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    const histories = await Store.find({ idUser })
      .sort({ createdAt: -1 })
      .select("-__v"); // remove o campo __v

    return res.status(200).json({
      success: true,
      count: histories.length,
      data: histories,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar histórias:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar histórias.",
      error: error.message,
    });
  }
};

/**
 * 🗑️ Excluir uma história específica
 */
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "O ID da história é obrigatório para exclusão.",
      });
    }

    const deleted = await Store.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "História não encontrada.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "História excluída com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro ao excluir história:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao excluir história.",
      error: error.message,
    });
  }
};

module.exports = {
  saveHistory,
  getUserHistories,
  deleteHistory,
};
