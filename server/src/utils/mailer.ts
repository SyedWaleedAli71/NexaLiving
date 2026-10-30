import nodemailer, {Transporter} from 'nodemailer';
import config from '../config/env';

let transporterPromise: Promise<Transporter> | null = null;

// Build a transporter. Uses real SMTP when configured; otherwise falls back to
// an Ethereal test account (emails are captured and a preview URL is logged).
async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    if (config.smtp.host && config.smtp.user) {
      console.log(`[mail] Using SMTP ${config.smtp.host}:${config.smtp.port}`);
      return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {user: config.smtp.user, pass: config.smtp.pass},
      });
    }

    console.log('[mail] No SMTP configured - creating Ethereal test account');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {user: testAccount.user, pass: testAccount.pass},
    });
  })();

  return transporterPromise;
}

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({to, subject, text, html}: MailOptions) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: config.mailFrom,
    to,
    subject,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[mail] Preview URL: ${previewUrl}`);
  }
  return info;
}

interface OtpEmailOptions {
  to: string;
  name: string;
  code: string;
  purpose: 'verify' | 'reset';
  ttlMinutes: number;
}

// Sends a 6-digit OTP email for either account verification or password reset.
export async function sendOtpEmail({
  to,
  name,
  code,
  purpose,
  ttlMinutes,
}: OtpEmailOptions) {
  const title =
    purpose === 'reset' ? 'Password Reset' : 'Email Verification';
  const intro =
    purpose === 'reset'
      ? 'You requested to reset your NexaLiving password.'
      : 'Please confirm your email address to activate your NexaLiving account.';

  const text = `Hi ${name},\n\n${intro}\n\nYour verification code is: ${code}\n\nThis code expires in ${ttlMinutes} minutes. If you did not request it, you can safely ignore this email.`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0F172A">
      <h2 style="color:#2563EB;margin-top:0">NexaLiving &middot; ${title}</h2>
      <p>Hi ${name},</p>
      <p>${intro}</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:800;color:#2563EB;margin:24px 0">${code}</p>
      <p style="color:#64748B;font-size:13px">This code expires in ${ttlMinutes} minutes. If you did not request it, you can safely ignore this email.</p>
    </div>`;

  return sendMail({to, subject: `${title} Code: ${code}`, text, html});
}
