import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { signupSchema, validate } from "@/lib/validators";
import { fail, ok } from "@/lib/http";
import { createSessionToken, sanitizeUser, setSessionCookie } from "@/lib/auth";
import { createVerificationToken } from "@/lib/security";
import { appEnv } from "@/lib/env";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export async function POST(request) {
  const json = await request.json().catch(() => null);
  const parsed = validate(signupSchema, json || {});
  if (!parsed.ok) {
    return fail("Invalid signup payload", 400, parsed.errors);
  }

  const { username, email, password } = parsed.data;

  await connectDb();

  const existingEmail = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existingEmail) {
    return fail("Email already in use", 409);
  }

  const existingUsername = await User.findOne({ username }).lean();
  if (existingUsername) {
    return fail("Username already in use", 409);
  }

  const requiresVerification = !!appEnv.requireEmailVerification;
  const emailReady = isEmailConfigured();

  if (requiresVerification && !emailReady) {
    return fail(
      "Email verification is required but no email provider is configured",
      500
    );
  }

  const tokenData = requiresVerification ? createVerificationToken() : null;
  const verificationExpiry = requiresVerification
    ? new Date(Date.now() + 1000 * 60 * 60 * 24)
    : null;
  const role =
    username.toLowerCase() === appEnv.ownerUsername.toLowerCase()
      ? "OWNER"
      : username.toLowerCase() === appEnv.defaultAdminUsername.toLowerCase()
      ? "ADMIN"
      : "USER";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role,
    emailVerifiedAt: requiresVerification ? null : new Date(),
    verificationTokenHash: tokenData ? tokenData.tokenHash : null,
    verificationTokenExpiresAt: verificationExpiry
  });

  if (requiresVerification) {
    const verifyUrl = `${appEnv.appUrl}/auth/verify?token=${tokenData.token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your Icongens Support account",
        html: `<p>Welcome, ${user.username}.</p><p>Please verify your email:</p><p><a href=\"${verifyUrl}\">Verify Email</a></p>`,
        text: `Welcome ${user.username}. Verify your email: ${verifyUrl}`
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      return fail("Email not found or unable to send verification email", 400);
    }
  }

  const sessionToken = await createSessionToken(user);
  setSessionCookie(sessionToken);

  return ok({
    user: sanitizeUser(user),
    requiresVerification,
    message: requiresVerification
      ? "Signup successful. Verification email sent."
      : "Signup successful. You can now log in."
  });
}
