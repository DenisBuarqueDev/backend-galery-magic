const mongoose = require("mongoose");

// 🔹 Definição do schema da imagem para colorir
const coloringImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "O título da imagem é obrigatório."],
      trim: true,
      minlength: [2, "O título deve ter pelo menos 2 caracteres."],
      maxlength: [30, "O título pode ter no máximo 30 caracteres."],
      set: (v) => v.charAt(0).toUpperCase() + v.slice(1).trim(),
    },

    image: {
      type: String,
      required: [true, "A URL da imagem SVG é obrigatória."],
      trim: true,
      validate: {
        validator: function (v) {
          // Aceita apenas URLs do Cloudinary com final .svg
          return /^https?:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/.*\.svg$/i.test(v);
        },
        message: "A URL da imagem SVG deve ser uma URL válida do Cloudinary.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "coloring_images",
  }
);

module.exports = mongoose.model("ColoringImage", coloringImageSchema);
