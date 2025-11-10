const Category = require("../models/Category");

/**
 * @desc Criar nova categoria
 * @route POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, english, description } = req.body;

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Essa categoria já existe." });
    }

    const category = await Category.create({ name, english, description });
    res.status(201).json(category);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ message: "Erro interno ao criar categoria." });
  }
};

/**
 * @desc Listar todas as categorias
 * @route GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar categorias." });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      message: "Categorias listadas com sucesso!",
      data: categories,
    });
  } catch (err) {
    console.error("❌ Erro ao listar categorias:", err);
    res.status(500).json({ error: "Erro ao listar categorias." });
  }
};

/**
 * @desc Buscar categoria por ID
 * @route GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Categoria não encontrada." });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar categoria." });
  }
};

/**
 * @desc Atualizar categoria
 * @route PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { name, english, description, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, english, description, isActive },
      { new: true, runValidators: true }
    );

    if (!category)
      return res.status(404).json({ message: "Categoria não encontrada." });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar categoria." });
  }
};

/**
 * @desc Deletar categoria
 * @route DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Categoria não encontrada." });

    res.json({ message: "Categoria removida com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover categoria." });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
