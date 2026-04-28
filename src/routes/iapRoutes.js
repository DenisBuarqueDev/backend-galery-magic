const express = require("express");
const router = express.Router();

const { validateSubscription } = require("../services/googlePlayService");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/User");

const isMock = process.env.IAP_MOCK_MODE === "true";

/**
 * =========================
 * 🧪 MOCK MODE (SEM AUTH)
 * =========================
 */
if (isMock) {
  router.post("/validate", async (req, res) => {
    console.log("🧪 MOCK MODE ATIVO");

    return res.json({
      valid: true,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  });
} else {
  /**
   * =========================
   * 🔐 PRODUÇÃO (COM AUTH)
   * =========================
   */

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
      console.error("Erro validate:", error);

      return res.status(500).json({
        valid: false,
        message: "Erro ao validar assinatura",
      });
    }
  });
}

module.exports = router;