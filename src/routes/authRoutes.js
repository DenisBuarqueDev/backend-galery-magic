const express = require("express");
const {
  register,
  login,
  logoutUser,
  getCurrentUser,
  getUserById,
} = require("../controllers/authController");
const { body } = require("express-validator");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("O nome é obrigatório.")
      .isLength({ min: 2 })
      .withMessage("O nome deve ter no mínimo 2 caracteres."),

    body("email")
      .trim()
      .isEmail()
      .withMessage("E-mail inválido.")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("A senha deve ter no mínimo 6 caracteres.")
      .matches(/[A-Z]/)
      .withMessage("A senha deve conter pelo menos uma letra maiúscula.")
      .matches(/[0-9]/)
      .withMessage("A senha deve conter pelo menos um número."),
  ],
  register
);

router.post("/login", login);
router.get("/validate", protect, (req, res) => res.status(200).json({ valid: true }));
router.get("/:id", protect, getUserById);
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logoutUser);

module.exports = router;
