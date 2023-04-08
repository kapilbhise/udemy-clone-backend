import { createTransport } from "nodemailer";

export const sendMail = async (to, subject, text) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return await transporter.sendMail({
    to: to,
    subject: subject,
    text: text,
    from: "kkk@gmail.com",
  });
};
