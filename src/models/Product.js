const mongoose = require("mongoose");

/**
 * Product Schema
 * Representa um item multimídia hospedado no Cloudinary (imagem e som). 
 */
const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "O título é obrigatório."],
      trim: true,
      minlength: [2, "O título deve ter no mínimo 2 caracteres."],
      maxlength: [100, "O título deve ter no máximo 100 caracteres."],
      index: true,
    },

    english: {
      type: String,
      required: [true, "O título em inglês é obrigatório."],
      trim: true,
      minlength: [2, "O título deve ter no mínimo 2 caracteres."],
      maxlength: [100, "O título deve ter no máximo 100 caracteres."],
      index: true,
    },

    espanhol: {
      type: String,
      required: [true, "O título em espanhol é obrigatório."],
      trim: true,
      minlength: [2, "O título deve ter no mínimo 2 caracteres."],
      maxlength: [100, "O título deve ter no máximo 100 caracteres."],
      index: true,
    },

    italiano: {
      type: String,
      required: [true, "O título em italiano é obrigatório."],
      trim: true,
      minlength: [2, "O título deve ter no mínimo 2 caracteres."],
      maxlength: [100, "O título deve ter no máximo 100 caracteres."],
      index: true,
    },

    frances: {
      type: String,
      required: [true, "O título em francês é obrigatório."],
      trim: true,
      minlength: [2, "O título deve ter no mínimo 2 caracteres."],
      maxlength: [100, "O título deve ter no máximo 100 caracteres."],
      index: true,
    },

    image: {
      type: String,
      required: [true, "A URL da imagem é obrigatória."],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) =>
          /^https?:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/.+/i.test(
            v
          ),
        message: "A URL da imagem deve ser uma URL válida do Cloudinary.",
      },
    },

    sound: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) =>
          !v ||
          /^https?:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/video\/upload\/.+/i.test(
            v
          ),
        message: "A URL do som deve ser uma URL válida do Cloudinary.",
      },
    },

    imagePublicId: {
      type: String,
      required: [true, "O public_id da imagem é obrigatório."],
      trim: true,
      select: false, // Oculta por padrão (segurança)
    },

    soundPublicId: {
      type: String,
      trim: true,
      select: false,
      default: null,
    },

    syllable: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "A categoria é obrigatória."],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "products",
  }
);

/**
 * Índices
 * - Busca textual no título e descrição
 * - Busca por categoria
 */
ProductSchema.index({ title: "text" });

/**
 * Virtuals
 * - Exemplo: URL amigável baseada no título
 */
ProductSchema.virtual("slug").get(function () {
  return this.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
});

/**
 * Método utilitário para serialização
 * Remove campos sensíveis e ajusta o formato de retorno
 */
ProductSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.imagePublicId;
  delete obj.soundPublicId;
  return obj;
};

module.exports = mongoose.model("Product", ProductSchema);
