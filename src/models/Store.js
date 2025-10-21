const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    // 🔗 ID do usuário que criou a história (referência ao model User)
    idUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "O ID do usuário é obrigatório."],
      index: true, // melhora consultas por usuário
    },

    // 🏷️ Título da história (resumo ou palavras-chave)
    title: {
      type: String,
      required: [true, "O título é obrigatório."],
      trim: true,
      minlength: [3, "O título deve ter pelo menos 3 caracteres."],
      maxlength: [120, "O título não pode ultrapassar 120 caracteres."],
    },

    // 📜 Texto completo da história
    text: {
      type: String,
      required: [true, "O texto da história é obrigatório."],
      trim: true,
      minlength: [10, "A história deve ter pelo menos 10 caracteres."],
    },
  },
  {
    timestamps: true, // cria createdAt e updatedAt automaticamente
    versionKey: false, // remove o campo __v
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🧩 Virtual: URL de acesso direto à história
historySchema.virtual("url").get(function () {
  return `/api/stories/${this._id}`;
});

// 🧹 Middleware: garante que título e texto estejam limpos
historySchema.pre("save", function (next) {
  if (this.text) this.text = this.text.trim();
  if (this.title) this.title = this.title.trim();
  next();
});

// 📦 Indexes otimizam performance em consultas frequentes
historySchema.index({ idUser: 1, createdAt: -1 }); // histórias por usuário ordenadas por data
historySchema.index({ title: "text", text: "text" }); // busca full-text

module.exports = mongoose.model("History", historySchema);
