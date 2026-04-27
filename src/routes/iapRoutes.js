const express = require("express");
const router = express.Router();

const { validateSubscription } = require("../services/googlePlayService");
const authMiddleware = require("../middlewares/auth");
const User = require("../models/User");

// 🔥 VALIDAR COMPRA (ASSINATURA)

router.post("/validate", authMiddleware, async (req, res) => {
  const { purchaseToken, productId } = req.body;
  const userId = req.user.id;

  if (!purchaseToken) {
    return res.status(400).json({
      valid: false,
      message: "purchaseToken é obrigatório",
    });
  }

  try {
    // 🔥 =========================
    // 🧪 MOCK MODE
    // 🔥 =========================
    if (process.env.IAP_MOCK_MODE === "true") {
      console.log("🧪 MOCK ATIVO");

      const fakeExpiry = new Date();
      fakeExpiry.setDate(fakeExpiry.getDate() + 30); // +30 dias

      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        subscription: {
          productId: productId || "premium_monthly",
          purchaseToken,
          expiryDate: fakeExpiry,
          autoRenewing: true,
          paymentState: 1,
          lastChecked: new Date(),
        },
      });

      return res.json({
        valid: true,
        expiresAt: fakeExpiry,
        mock: true,
      });
    }

    // 🔥 =========================
    // 🚀 PRODUÇÃO (GOOGLE)
    // 🔥 =========================
    const result = await validateSubscription({
      packageName: "com.denisbuarque.HistoriasMagicasIA",
      subscriptionId: productId,
      purchaseToken,
    });

    const isPaid = result.paymentState === 1;
    const isNotExpired = Date.now() < Number(result.expiryTimeMillis);

    const isValid = isPaid && isNotExpired;

    if (!isValid) {
      return res.status(400).json({
        valid: false,
        message: "Assinatura inválida",
      });
    }

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      subscription: {
        productId,
        purchaseToken,
        expiryDate: new Date(Number(result.expiryTimeMillis)),
        autoRenewing: result.autoRenewing,
        paymentState: result.paymentState,
        lastChecked: new Date(),
      },
    });

    return res.json({
      valid: true,
      expiresAt: result.expiryTimeMillis,
    });
  } catch (error) {
    console.error("Erro validate:", error);

    return res.status(500).json({
      valid: false,
      message: "Erro ao validar assinatura",
    });
  }
});

/*router.post("/validate", authMiddleware, async (req, res) => {
  const { purchaseToken, productId } = req.body;
  const userId = req.user.id;

  if (!purchaseToken || !productId) {
    return res.status(400).json({
      valid: false,
      message: "Dados obrigatórios faltando",
    });
  }

  try {
    const result = await validateSubscription({
      packageName: "com.denisbuarque.HistoriasMagicasIA",
      subscriptionId: productId,
      purchaseToken,
    });

    const isPaid = result.paymentState === 1;
    const isNotExpired = Date.now() < Number(result.expiryTimeMillis);
    const isCanceled = result.cancelReason !== undefined;

    const isValid = isPaid && isNotExpired && !isCanceled;

    if (!isValid) {
      return res.status(400).json({
        valid: false,
        message: "Assinatura inválida",
      });
    }

    // 🔒 Anti-fraude correto
    const existingUser = await User.findOne({
      "subscription.purchaseToken": purchaseToken,
    });

    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        valid: false,
        message: "Token já usado",
      });
    }

    // 🔥 Atualização correta
    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      subscription: {
        productId,
        purchaseToken,
        expiryDate: new Date(Number(result.expiryTimeMillis)),
        autoRenewing: result.autoRenewing,
        paymentState: result.paymentState,
        lastChecked: new Date(),
      },
    });

    return res.json({
      valid: true,
      expiresAt: result.expiryTimeMillis,
    });
  } catch (error) {
    console.error("Erro validate:", error);

    return res.status(500).json({
      valid: false,
      message: "Erro ao validar assinatura",
    });
  }
});*/

module.exports = router;