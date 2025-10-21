const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { body } = require("express-validator");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadCloudinary");

const router = express.Router();

// Rotas protegidas
router.use(protect);

router.post(
  "/",
  upload.single("image"),
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
  createUser
);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", upload.single("image"), updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
