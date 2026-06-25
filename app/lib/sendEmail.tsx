import nodemailer from 'nodemailer';
import { render } from 'react-email';
import { Email, ResetPasswordEmail } from './email';

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "masteryourstudies100@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD, // NOT your real password
  },
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





