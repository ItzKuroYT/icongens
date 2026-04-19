import nodemailer from "nodemailer";
import { Resend } from "resend";
import { appEnv } from "./env";

function getTransport() {
  if (appEnv.resendApiKey) {
    const resend = new Resend(appEnv.resendApiKey);
    return {
      type: "resend",
      send: async ({ to, subject, html, text }) => {
        await resend.emails.send({
          from: appEnv.emailFrom,
          to,
          subject,
          html,
          text
        });
      }
    };
  }

  if (appEnv.smtpHost && appEnv.smtpUser && appEnv.smtpPass) {
    const transporter = nodemailer.createTransport({
      host: appEnv.smtpHost,
      port: appEnv.smtpPort,
      secure: appEnv.smtpPort === 465,
      auth: {
        user: appEnv.smtpUser,
        pass: appEnv.smtpPass
      }
    });

    return {
      type: "smtp",
      send: async ({ to, subject, html, text }) => {
        await transporter.sendMail({
          from: appEnv.emailFrom,
          to,
          subject,
          html,
          text
        });
      }
    };
  }

  return null;
}

export async function sendEmail({ to, subject, html, text }) {
  const provider = getTransport();
  if (!provider) {
    throw new Error("Email provider not configured");
  }

  await provider.send({ to, subject, html, text });
}
