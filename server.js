const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const http = require("http");

dotenv.config();
connectDB();

const app = express();

// Middlewares básicos
app.use(cookieParser());
app.use(express.json());

// ✅ Configuração de CORS segura e compatível com Render
const allowedOrigins = [
  //"https://frontend-galery-magic.vercel.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ Aplica CORS em todas as rotas (depois de definir corsOptions)
app.use(cors(corsOptions));

// Importa rotas
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const storiesRoutes = require("./src/routes/storiesRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");

// Usa rotas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/categories", categoryRoutes);

// rota protegida de teste:
app.get("/api/me", (req, res) => {
  res.json({ ok: true });
});

// Uploads públicos
app.use("/uploads", express.static(path.join(__dirname, "src/uploads")));

// Rota de teste
app.get("/", (req, res) => {
  res.send("API funcionando com CORS!");
});

const server = http.createServer(app);

// Porta
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
