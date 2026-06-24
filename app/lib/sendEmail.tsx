import nodemailer from 'nodemailer';
import { render } from 'react-email';
import { Email, ResetPasswordEmail } from './email';

const transporter = nodemailer.createTransport({
  service: "gmail", // Shortcut for Gmail's SMTP settings - see Well-Known Services
  auth: {
    user: "masteryourstudies100@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});



export const sendEmail = async ({ to, subject, url, type }: { to: string; subject: string; url: string; type?: string }) => {
  // For demonstration, we'll just log the email details.
  // In a real application, you'd integrate with an email service like SendGrid, Mailgun, etc.

  let  emailHtml:string = "";
  if(type === "reset-password") {
    emailHtml = await render(<ResetPasswordEmail url={url} />);
  } else {
    emailHtml = await render(<Email url={url} />);
  }


  const options = {
    from: 'Mastring <masteryourstudies100@gmail.com',
    to,
    subject,
    html: emailHtml,
  };

  await transporter.sendMail(options);
}