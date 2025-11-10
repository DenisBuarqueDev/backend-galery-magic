const express = require("express");
const { body } = require("express-validator");
const {
  createProduct,
  getProducts, 
  getProductsByCategory,
  getProductById,
  updateProduct,
  deleteProduct,
  geminiCreateStory,
} = require("../controllers/productController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadCloudinary");

const router = express.Router();

/**
 * 🔒 Middleware global para proteger todas as rotas
 */
router.use(protect);

/**
 * 📘 Validações reutilizáveis
 */
const productValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("O título é obrigatório.")
    .isLength({ min: 2, max: 100 })
    .withMessage("O título deve ter entre 2 e 100 caracteres."),
  body("sound")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !/^https?:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/video\/upload\/.+/i.test(value)) {
        throw new Error("A URL do som deve ser uma URL válida do Cloudinary.");
      }
      return true;
    }),
];

/**
 * 🧠 Geração de história com IA
 * Endpoint: POST /products/gemini/story
 */
router.post("/gemini/story", geminiCreateStory);

/**
 * 📦 CRUD de Produtos
 */
router
  .route("/")
  .get(getProductsByCategory)
  .get(getProducts)
  .post(upload.single("image"), productValidation, createProduct);


router
  .route("/:id")
  .get(getProductById)
  .put(upload.single("image"), productValidation, updateProduct)
  .delete(deleteProduct);

module.exports = router;
