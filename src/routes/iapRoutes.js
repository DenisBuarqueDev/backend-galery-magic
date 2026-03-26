const express = require("express");
const router = express.Router();

const { validateSubscription } = require("../services/googlePlayService");
const authMiddleware = require("../middlewares/auth");
const User = require("../models/User");

// 🔥 VALIDAR COMPRA (ASSINATURA)
router.post("/validate", authMiddleware, async (req, res) => {
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

    // 🔥 VALIDAÇÃO REAL
    const isPaymentValid = result.paymentState === 1;
    const isNotExpired =
      Date.now() < Number(result.expiryTimeMillis);

    const isValid = isPaymentValid && isNotExpired;

    if (!isValid) {
      return res.status(400).json({
        valid: false,
        message: "Assinatura inválida ou expirada",
      });
    }

    // 🔒 ANTI-FRAUDE (token único)
    const existingUser = await User.findOne({ purchaseToken });

    if (
      existingUser &&
      existingUser._id.toString() !== userId
    ) {
      return res.status(400).json({
        valid: false,
        message: "Token já está sendo usado por outro usuário",
      });
    }

    // 🔥 ATUALIZA USUÁRIO
    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      purchaseToken,
      premiumExpiresAt: new Date(
        Number(result.expiryTimeMillis)
      ),
    });

    return res.json({
      valid: true,
      expiresAt: result.expiryTimeMillis,
    });
  } catch (error) {
    console.error("Erro validate purchase:", error);

    return res.status(500).json({
      valid: false,
      message: "Erro ao validar assinatura",
    });
  }
});

module.exports = router;