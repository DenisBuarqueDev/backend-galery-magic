const express = require("express");
const {
  createLetter,
  getLetters,
} = require("../controllers/letterController");
const { body } = require("express-validator");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Rotas protegidas
router.use(protect);

router.post(
  "/",
  [
    body("letter")
      .trim()
      .notEmpty()
      .withMessage("OA letra é obrigatório.")
      .isLength({ min: 1, max: 5 })
      .withMessage("A letra deve ter no mínimo 1 e no máximo 5 caracteres."),
  ],
  createLetter
);

router.get("/", getLetters);

module.exports = router;
