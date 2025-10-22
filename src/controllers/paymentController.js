// src/controllers/paymentController.js
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const dotenv = require("dotenv");
const { sendEmail } = require("../utils/sendEmail");
const { generatePassword } = require("../utils/generatePassword");
dotenv.config();

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

// Cria preferência de pagamento
const createPreference = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail obrigatório" });

    const body = {
      items: [
        {
          title: "Galeria Mágica",
          quantity: 1,
          unit_price: 19.9,
          currency_id: "BRL",
        },
      ],
      payer: { email },
      back_urls: {
        success: "https://frontend-galery-magic.vercel.app",
        failure: "https://frontend-galery-magic.vercel.app",
        pending: "https://frontend-galery-magic.vercel.app",
      },
      auto_return: "approved",
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({
      id: result.id || result.body?.id,
      init_point: result.init_point || result.body?.init_point,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    res.status(500).json({ error: error.message });
  }
};

// Webhook para receber notificação de pagamento aprovado
const handleWebhook = async (req, res) => {
  try {
    const notification = req.body;

    // Verifica se a notificação é de pagamento
    if (notification.type === "payment") {
      const paymentId = notification.data.id;

      // Busca o pagamento no Mercado Pago
      const payment = await Payment.findById(client, paymentId);

      if (payment.body.status === "approved") {
        const payerEmail = payment.body.payer.email;

        // Gera senha e envia email
        const password = generatePassword();
        await sendEmail(payerEmail, password);

        console.log(`Senha enviada para: ${payerEmail}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(500);
  }
};

module.exports = { createPreference, handleWebhook };
