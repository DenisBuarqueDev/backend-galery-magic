const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * Representa um usuário autenticável do sistema.
 */
const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "O primeiro nome é obrigatório."],
      trim: true,
      minlength: [2, "O nome deve ter no mínimo 2 caracteres."],
      maxlength: [50, "O nome deve ter no máximo 50 caracteres."],
    },

    email: {
      type: String,
      required: [true, "O e-mail é obrigatório."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido."],
      index: true, // melhora performance de login/buscas
    },

    password: {
      type: String,
      required: [true, "A senha é obrigatória."],
      minlength: [6, "A senha deve ter no mínimo 6 caracteres."],
      select: false, // nunca retorna a senha por padrão
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users",
  }
);

/**
 * Criptografa a senha antes de salvar
 */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compara senha digitada com hash armazenado
 */
UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
module.exports = mongoose.model("User", UserSchema);
