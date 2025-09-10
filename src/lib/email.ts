import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST as string;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER as string;
const smtpPass = process.env.SMTP_PASS as string;
const fromEmail = process.env.EMAIL_FROM as string;

if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
  console.warn("SMTP configuration is missing. Email sending will not work until configured.");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass },
});

export async function sendOtpEmail(to: string, otp: string) {
  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error("SMTP not configured");
  }
  const info = await transporter.sendMail({
    from: fromEmail,
    to,
    subject: "Your ArticleFeeds verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <b>${otp}</b>.</p><p>It expires in 10 minutes.</p>`,
  });
  return info.messageId;
}

export function generateOtp(length = 6) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * 10)];
  return code;
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error("SMTP not configured");
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  const info = await transporter.sendMail({
    from: fromEmail,
    to,
    subject: "Reset your ArticleFeeds password",
    text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Reset Your Password</h2>
        <p>You requested to reset your password for your ArticleFeeds account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #6B7280; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a>
        </p>
      </div>
    `,
  });
  return info.messageId;
}


