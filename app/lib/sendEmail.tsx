import nodemailer from 'nodemailer';
import { render } from 'react-email';
import { Email, ResetPasswordEmail } from './email';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER ?? process.env.GMAIL_USER ?? "masteryourstudies100@gmail.com",
    pass: process.env.SMTP_PASS ?? process.env.GOOGLE_APP_PASSWORD,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});



export const sendEmail = async ({ to, subject, url, type }: { to: string; subject: string; url: string; type?: string }) => {
  let emailHtml = "";
  if (type === "reset-password") {
    emailHtml = await render(<ResetPasswordEmail url={url} />);
  } else {
    emailHtml = await render(<Email url={url} />);
  }


  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "Mystudies <masteryourstudies100@gmail.com>",
      to,
      subject,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Failed to send email", error);
    throw error;
  }
};





