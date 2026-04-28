const express = require("express");
const router = express.Router();

const { validateSubscription } = require("../services/googlePlayService");
const authMiddleware = require("../middlewares/auth");
const User = require("../models/User");

// 🔥 VALIDAR COMPRA (ASSINATURA)

const isMock = process.env.IAP_MOCK_MODE === "true";

router.post("/validate", isMock ? async (req, res) => {
  // 🔥 MOCK DIRETO (SEM AUTH)
  return res.json({
    valid: true,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
} : [authMiddleware, async (req, res) => {
  // 🔥 PRODUÇÃO (COM AUTH)
  const { purchaseToken } = req.body;
  const userId = req.user.id;

  if (!purchaseToken) {
    return res.status(400).json({
      valid: false,
      message: "purchaseToken é obrigatório",
    });
  }

  try {
    const result = await validateSubscription({
      packageName: "com.denisbuarque.HistoriasMagicasIA",
      subscriptionId: "premium_monthly",
      purchaseToken,
    });

    const isPaymentValid = result.paymentState === 1;
    const isNotExpired = Date.now() < Number(result.expiryTimeMillis);

    const isValid = isPaymentValid && isNotExpired;

    if (!isValid) {
      return res.status(400).json({
        valid: false,
        message: "Assinatura inválida ou expirada",
      });
    }

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      purchaseToken,
      premiumExpiresAt: new Date(Number(result.expiryTimeMillis)),
    });

    return res.json({
      valid: true,
      expiresAt: result.expiryTimeMillis,
    });

  } catch (error) {
    return res.status(500).json({
      valid: false,
      message: "Erro ao validar assinatura",
    });
  }
}]);

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