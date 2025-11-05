const express  = require("express");
const { body, param }  = require("express-validator");
const {
  saveHistory,
  getUserHistories,
  deleteHistory,
}  = require("../controllers/historyController.js");
const protect  = require("../middlewares/authMiddleware.js");

const router = express.Router();

/**
 * 🔒 Aplica o middleware de autenticação em todas as rotas
 */
router.use(protect);

/**
 * ✅ Validações comuns para criação de histórias
 */
const validateHistory = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("O título é obrigatório.")
    .isLength({ min: 2, max: 100 })
    .withMessage("O título deve ter entre 2 e 100 caracteres."),
  body("text")
    .trim()
    .notEmpty()
    .withMessage("O texto da história é obrigatório."),
  body("idUser")
    .trim()
    .notEmpty()
    .withMessage("O ID do usuário é obrigatório.")
    .isMongoId()
    .withMessage("O ID do usuário deve ser um ObjectId válido."),
];

/**
 * ✅ Rota: Criar nova história
 * Método: POST /api/histories
 */
router.post("/:idUser", validateHistory, saveHistory);

/**
 * ✅ Rota: Listar todas as histórias de um usuário
 * Método: GET /api/histories/:idUser
 */
router.get(
  "/:idUser",
  param("idUser")
    .isMongoId()
    .withMessage("O ID do usuário deve ser válido."),
  getUserHistories
);

/**
 * ✅ Rota: Deletar uma história específica
 * Método: DELETE /api/stories/:id
 */
router.delete(
  "/:id",
  param("id")
    .isMongoId()
    .withMessage("O ID da história deve ser válido."),
  deleteHistory
);

module.exports = router;

