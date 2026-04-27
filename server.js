require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");

const connectDB = require("./src/config/db");

// 🔥 Conectar banco
connectDB();

const app = express();

// =========================
// 🔐 MIDDLEWARES GLOBAIS
// =========================
app.use(express.json());
app.use(cookieParser());

// =========================
// 🌍 CORS (WEB + MOBILE)
// =========================
const allowedOrigins = [
  //"http://localhost:5173",
  "https://frontend-galery-magic.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // 🔥 permite mobile (sem origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// =========================
// 📦 ROTAS
// =========================
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const storiesRoutes = require("./src/routes/storiesRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const iapRoutes = require("./src/routes/iapRoutes");

// 🔥 Rotas principais
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/categories", categoryRoutes);

// 🔥 IAP (corrigido)
app.use("/api/iap", iapRoutes);

// =========================
// 🔐 ROTA /ME (PROTEGIDA)
// =========================
const authMiddleware = require("./src/middlewares/authMiddleware");

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const User = require("./src/models/User");

    const user = await User.findById(req.user.id);

    const isPremium =
      user?.subscription?.expiryDate &&
      new Date(user.subscription.expiryDate) > new Date();

    res.json({
      isPremium,
      premiumExpiresAt: user?.subscription?.expiryDate || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

// =========================
// 📁 ARQUIVOS ESTÁTICOS
// =========================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "src/uploads"))
);

// =========================
// 🧪 ROTA TESTE
// =========================
app.get("/", (req, res) => {
  res.send("🚀 API rodando com sucesso!");
});

// =========================
// ❌ TRATAMENTO DE ERROS GLOBAL
// =========================
app.use((err, req, res, next) => {
  console.error("❌ Erro:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Erro interno do servidor",
  });
});

// =========================
// 🚀 SERVIDOR
// =========================
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});