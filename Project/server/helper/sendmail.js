import "dotenv/config";
import { createTransport } from "nodemailer";

export function sendEmail(email, mailSubject, body) {
  const transport = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: mailSubject,
    html: body,
  };

  transport.sendMail(mailOptions, function (err, result) {
    if (err) {
      console.log("Error in sending email", err);
    } else {
      console.log("Email has been sent");
    }
  });
}