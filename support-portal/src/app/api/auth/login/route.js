import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { loginSchema, validate } from "@/lib/validators";
import { createSessionToken, sanitizeUser, setSessionCookie } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { appEnv } from "@/lib/env";

export async function POST(request) {
  const json = await request.json().catch(() => null);
  const parsed = validate(loginSchema, json || {});
  if (!parsed.ok) {
    return fail("Invalid login payload", 400, parsed.errors);
  }

  const { identifier, password } = parsed.data;
  const normalized = identifier.toLowerCase();

  await connectDb();
  const user = await User.findOne({
    $or: [{ email: normalized }, { username: identifier }]
  });
  if (!user) {
    return fail("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return fail("Invalid credentials", 401);
  }

  if (appEnv.requireEmailVerification && !user.emailVerifiedAt) {
    return fail("Please verify your email before logging in", 403);
  }

  const usernameLower = String(user.username || "").toLowerCase();
  const ownerLower = String(appEnv.ownerUsername || "").toLowerCase();
  const adminLower = String(appEnv.defaultAdminUsername || "").toLowerCase();
  const nextRole =
    usernameLower === ownerLower ? "OWNER" : usernameLower === adminLower ? "ADMIN" : user.role;

  if (nextRole !== user.role) {
    user.role = nextRole;
    await user.save();
  }

  const sessionToken = await createSessionToken(user);
  setSessionCookie(sessionToken);

  return ok({
    user: sanitizeUser(user),
    message: "Logged in"
  });
}
