import nodemailer from 'nodemailer';
import { render } from 'react-email';
import { Email } from './email';

const transporter = nodemailer.createTransport({
  service: "gmail", // Shortcut for Gmail's SMTP settings - see Well-Known Services
  auth: {
    user: "masteryourstudies100@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});



export const sendEmail = async ({ to, subject, url }: { to: string; subject: string; url: string }) => {
  // For demonstration, we'll just log the email details.
  // In a real application, you'd integrate with an email service like SendGrid, Mailgun, etc.
  const emailHtml = await render(<Email url={url} />);

  const options = {
    from: 'Mastring <masteryourstudies100@gmail.com',
    to,
    subject,
    html: emailHtml,
  };

  await transporter.sendMail(options);
}