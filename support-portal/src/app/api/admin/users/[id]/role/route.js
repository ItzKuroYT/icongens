import { connectDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/lib/models/User";
import { roleSchema, validate } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export async function PATCH(request, { params }) {
  const auth = await requireAuth({ roles: ["ADMIN", "OWNER"] });
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  const body = await request.json().catch(() => null);
  const parsed = validate(roleSchema, body || {});
  if (!parsed.ok) {
    return fail("Invalid role payload", 400, parsed.errors);
  }

  await connectDb();
  const user = await User.findById(params.id);
  if (!user) {
    return fail("User not found", 404);
  }

  if (String(user._id) === String(auth.user._id) && parsed.data.role === "USER") {
    return fail("You cannot demote yourself to USER", 400);
  }

  user.role = parsed.data.role;
  await user.save();

  return ok({
    user: {
      id: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt,
      createdAt: user.createdAt
    }
  });
}
