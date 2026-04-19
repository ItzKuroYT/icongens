export const appEnv = {
  appUrl: process.env.APP_URL || "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  defaultAdminUsername: process.env.DEFAULT_ADMIN_USERNAME || "ItzKuroYT",
  ownerUsername: process.env.OWNER_USERNAME || "ItzKuroYT",
  emailFrom: process.env.EMAIL_FROM || "Icongens Support <support@example.com>",
  resendApiKey: process.env.RESEND_API_KEY || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || ""
};

export function assertRequiredConfig() {
  if (!appEnv.mongoUri) {
    throw new Error("MONGODB_URI is required");
  }
  if (!appEnv.jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }
}
