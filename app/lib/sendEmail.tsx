import nodemailer from 'nodemailer';
import { render } from 'react-email';
import { Email, ResetPasswordEmail } from './email';
import { Resend } from 'resend';


// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST ?? "smtp.gmail.com",
//   port: Number(process.env.SMTP_PORT ?? 587),  // 587, not 465
//   secure: false,                                 // false for STARTTLS
//   requireTLS: true,                              // upgrade to TLS after connect
//   auth: {
//     user: process.env.SMTP_USER ?? "masteryourstudies100@gmail.com",
//     pass: process.env.SMTP_PASS ?? process.env.GOOGLE_APP_PASSWORD,
//   },
//   connectionTimeout: 15000,
//   greetingTimeout: 15000,
//   socketTimeout: 15000,
// });


const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to, subject, url, type
}: {
  to: string; subject: string; url: string; type?: string
}) => {
  const emailHtml = type === "reset-password"
    ? await render(<ResetPasswordEmail url={url} />)
    : await render(<Email url={url} />);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Mystudies <onboarding@resend.dev>",
    to,
    subject,
    html: emailHtml,
  });

    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM ?? "Mystudies <masteryourstudies100@gmail.com>",
    //   to,
    //   subject,
    //   html: emailHtml,
    // });

  if (error) {
    console.error("Failed to send email", error);
    throw new Error(error.message);
  }
};









