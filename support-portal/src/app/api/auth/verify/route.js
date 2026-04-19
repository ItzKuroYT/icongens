import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { hashVerificationToken } from "@/lib/security";
import { fail, ok } from "@/lib/http";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const token = body && typeof body.token === "string" ? body.token : "";
  if (!token) {
    return fail("Verification token is required", 400);
  }

  const tokenHash = hashVerificationToken(token);

  await connectDb();
  const user = await User.findOne({
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    return fail("Verification token is invalid or expired", 400);
  }

  user.emailVerifiedAt = new Date();
  user.verificationTokenHash = null;
  user.verificationTokenExpiresAt = null;
  await user.save();

  return ok({ message: "Email verified successfully" });
}
