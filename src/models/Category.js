const mongoose = require("mongoose");

/**
 * Category Schema
 * Representa uma categoria de produtos.
 */
const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "O nome da categoria é obrigatório."],
            trim: true,
            minlength: [2, "O nome deve ter no mínimo 2 caracteres."],
            maxlength: [50, "O nome deve ter no máximo 50 caracteres."],
            unique: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [200, "A descrição deve ter no máximo 200 caracteres."],
            default: "",
        },

        // ⬅️ CAMPO ADICIONADO PARA O FRONTEND (ÍCONE DO IONICONS)
        icon: { 
            type: String,
            required: [true, "O ícone é obrigatório para exibição no frontend."],
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "categories",
    }
);

/**
 * Índice de busca textual no nome e descrição
 */
CategorySchema.index({ name: "text", description: "text" });

/**
 * Virtual para slug amigável
 */
CategorySchema.virtual("slug").get(function () {
    return this.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
});

module.exports = mongoose.model("Category", CategorySchema);