const nodemailer = require("nodemailer");

exports.sendEmail = async (to, password) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Galeria Mágica" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Sua senha de acesso",
    html: `<p>Pagamento aprovado! Sua senha de acesso é: <b>${password}</b></p>
           <p>Acesse: <a href="https://frontend-galery-magic.vercel.app">Clique aqui</a></p>`,
  });
};
