import nodemailer from 'nodemailer';
import { render } from 'react-email';
import { Email, ResetPasswordEmail } from './email';

const smtpUser = process.env.SMTP_USER ?? process.env.GMAIL_USER ?? "masteryourstudies100@gmail.com";
const smtpPass = process.env.SMTP_PASS ?? process.env.GOOGLE_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});



export const sendEmail = async ({ to, subject, url, type }: { to: string; subject: string; url: string; type?: string }) => {
  if (!smtpPass) {
    throw new Error("Missing SMTP credentials. Set SMTP_PASS or GOOGLE_APP_PASSWORD in your environment.");
  }

  let emailHtml = "";
  if (type === "reset-password") {
    emailHtml = await render(<ResetPasswordEmail url={url} />);
  } else {
    emailHtml = await render(<Email url={url} />);
  }

  const options = {
    from: process.env.EMAIL_FROM ?? "Mystudies <masteryourstudies100@gmail.com>",
    to,
    subject,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.error("Failed to send email", error);
    throw error;
  }
};