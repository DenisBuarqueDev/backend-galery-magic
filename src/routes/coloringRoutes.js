const express = require("express");
const { body } = require("express-validator");
const {
  createImage,
  getAllImages,
  getImageById,
  updateImage,
  deleteImage,
} = require("../controllers/coloringImageController");

const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadCloudinary");

const router = express.Router();

/**
 * 📘 Validações
 */
const imageValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("O título é obrigatório.")
    .isLength({ min: 2, max: 30 })
    .withMessage("O título deve ter entre 2 e 30 caracteres."),
];

/**
 * 🔒 Middleware global — todas as rotas abaixo exigem autenticação
 */
router.use(protect);

/**
 * 🧩 Rotas protegidas de CRUD
 */
router.get("/", getAllImages);
router.get("/:id", getImageById);
router.post("/", upload.single("image"), imageValidation, createImage);
router.put("/:id", upload.single("image"), imageValidation, updateImage);
router.delete("/:id", deleteImage);

module.exports = router;
