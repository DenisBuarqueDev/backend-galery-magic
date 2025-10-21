const mongoose = require("mongoose");

/**
 * Letter Schema
 * Representa um usuário autenticável do sistema.
 */
const LetterSchema = new mongoose.Schema(
  {
    letter: {
      type: String,
      required: [true, "A letra é obrigatório."],
      trim: true,
      minlength: [1, "O letra deve ter no mínimo 1 caracteres."],
      maxlength: [5, "O letra deve ter no máximo 5 caracteres."],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "letters",
  }
);

module.exports = mongoose.model("Letter", LetterSchema);
