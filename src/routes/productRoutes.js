// src/routes/productRoutes.js
const express = require("express");
const { body } = require("express-validator");
const {
    createProduct,
    getProducts, // Lista todos (sem filtro)
    getProductsByCategory, // Lista com filtro por categoria
    getProductById,
    updateProduct,
    deleteProduct,
    geminiCreateStory,
} = require("../controllers/productController");
// const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadCloudinary"); // Usando seu nome de middleware

const router = express.Router();

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
    // 💡 Incluir validação para 'english' também, já que é obrigatório no Model
    body("english")
        .trim()
        .notEmpty()
        .withMessage("O título em inglês é obrigatório."),
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
 * Endpoint: POST /api/products/story (Ajustado para ser mais claro)
 */
router.post("/story", geminiCreateStory); // ⬅️ Rotas de IA separadas da rota principal

/**
 * 📦 Rotas de Listagem e Filtragem
 */
// 1. Rota principal: GET /api/products (Retorna TUDO, sem filtro)
router.get("/", getProducts);

// 2. Rota de Filtragem: GET /api/products/filter (Retorna filtrado por query params: ?categoryId=...)
router.get("/filter", getProductsByCategory); // ⬅️ Rota distinta para o filtro

/**
 * 📦 CRUD de Produtos (POST, PUT, DELETE)
 */
// POST /api/products
router.post(
    "/",
    upload.single("image"), // Upload da imagem
    productValidation, // Validação de dados
    createProduct
);

// Rotas por ID
router
    .route("/:id")
    .get(getProductById)
    .put(upload.single("image"), productValidation, updateProduct) // PUT /api/products/:id
    .delete(deleteProduct); // DELETE /api/products/:id

module.exports = router;