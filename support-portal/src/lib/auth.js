import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { appEnv } from "./env";
import { connectDb } from "./db";
import { User } from "./models/User";

const COOKIE_NAME = "fr_support_token";
const encoder = new TextEncoder();

function getSecret() {
  if (!appEnv.jwtSecret) {
    throw new Error("JWT_SECRET missing");
  }
  return encoder.encode(appEnv.jwtSecret);
}

export async function createSessionToken(user) {
  return await new SignJWT({
    sub: String(user._id),
    role: user.role,
    username: user.username
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function readSessionToken() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function requireAuth(options = {}) {
  const payload = await readSessionToken();
  if (!payload || !payload.sub) {
    return { ok: false, status: 401, message: "Authentication required" };
  }

  await connectDb();
  const user = await User.findById(payload.sub).lean();
  if (!user) {
    return { ok: false, status: 401, message: "Session invalid" };
  }

  const allowedRoles = options.roles || null;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { ok: false, status: 403, message: "Permission denied" };
  }

  return { ok: true, user };
}

export function sanitizeUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    role: user.role,
    emailVerified: !!user.emailVerifiedAt,
    createdAt: user.createdAt
  };
}
