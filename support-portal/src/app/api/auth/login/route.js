import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { loginSchema, validate } from "@/lib/validators";
import { createSessionToken, sanitizeUser, setSessionCookie } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function POST(request) {
  const json = await request.json().catch(() => null);
  const parsed = validate(loginSchema, json || {});
  if (!parsed.ok) {
    return fail("Invalid login payload", 400, parsed.errors);
  }

  const { email, password } = parsed.data;

  await connectDb();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return fail("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return fail("Invalid email or password", 401);
  }

  if (!user.emailVerifiedAt) {
    return fail("Please verify your email before logging in", 403);
  }

  const sessionToken = await createSessionToken(user);
  setSessionCookie(sessionToken);

  return ok({
    user: sanitizeUser(user),
    message: "Logged in"
  });
}
