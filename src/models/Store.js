const mongoose = require("mongoose");

const storySchema = new mongoose.Schema( // Renomeado para storySchema
    {
        // 🔗 ID do usuário que criou a história
        idUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "O ID do usuário é obrigatório."],
            index: true,
        },

        // 🖼️ URL da Imagem do Card (necessário para o frontend)
        imageUrl: {
            type: String,
            required: [true, "A URL da imagem é obrigatória."],
            trim: true,
        },

        // 🔗 REFERÊNCIA DE CHAVE ESTRANGEIRA para o Model de Categoria
        idCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category", // Referencia o model Category que criamos
            required: [true, "A categoria é obrigatória."],
            index: true,
        },

        // 🏷️ Título/Palavra em Português (Substitui 'title')
        tituloPt: {
            type: String,
            required: [true, "O título em português é obrigatório."],
            trim: true,
            minlength: [2, "O título deve ter pelo menos 2 caracteres."],
            maxlength: [80, "O título não pode ultrapassar 80 caracteres."],
        },
        
        // 🏷️ Título/Palavra em Inglês (Para o recurso de dupla linguagem)
        tituloEn: {
            type: String,
            required: [true, "O título em inglês é obrigatório."],
            trim: true,
            minlength: [2, "O título deve ter pelo menos 2 caracteres."],
            maxlength: [80, "O título não pode ultrapassar 80 caracteres."],
        },

        // 📜 Texto completo da história (Substitui 'text') - Opcional para cards curtos
        fullStoryText: { 
            type: String,
            trim: true,
            minlength: [10, "A história deve ter pelo menos 10 caracteres."],
            default: '',
        },

        // 🎧 Referências para URLs ou nomes de arquivos de Áudio/Som (MP3)
        audioUrlPt: { type: String, default: '' },
        audioUrlEn: { type: String, default: '' },
        soundUrlAnimal: { type: String, default: '' },
        
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// 📦 Indexes otimizam performance em consultas frequentes
storySchema.index({ idUser: 1, createdAt: -1 });
storySchema.index({ tituloPt: "text", fullStoryText: "text" }); // Busca full-text

module.exports = mongoose.model("Story", storySchema); // Exportado como Story