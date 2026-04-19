import { connectDb } from "@/lib/db";
import { requireAuth, sanitizeUser } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAuth({ roles: ["ADMIN", "OWNER"] });
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  await connectDb();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  return ok({ users: users.map(sanitizeUser) });
}
