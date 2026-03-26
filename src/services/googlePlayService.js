const { google } = require("googleapis");

// 🔥 Autenticação com Google Play
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "./config/google-service-account.json",
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

// 🔥 Cliente Android Publisher
const androidpublisher = google.androidpublisher({
  version: "v3",
  auth,
});

// 🔥 VALIDAR ASSINATURA
async function validateSubscription({
  packageName,
  subscriptionId,
  purchaseToken,
}) {
  if (!packageName || !subscriptionId || !purchaseToken) {
    throw new Error("Dados inválidos para validação");
  }

  try {
    const res = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    const data = res.data;

    // 🔥 LOG DEBUG (remova em produção se quiser)
    console.log("📦 Google Response:", {
      orderId: data.orderId,
      paymentState: data.paymentState,
      expiryTimeMillis: data.expiryTimeMillis,
    });

    return data;
  } catch (error) {
    console.error("❌ Erro Google API:", error?.response?.data || error.message);

    // 🔥 Tratamento inteligente de erro
    if (error.code === 401) {
      throw new Error("Credenciais inválidas da Google API");
    }

    if (error.code === 404) {
      throw new Error("Compra não encontrada");
    }

    throw new Error("Erro ao validar assinatura no Google");
  }
}

module.exports = { validateSubscription };