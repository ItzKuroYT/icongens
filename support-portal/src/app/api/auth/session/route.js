import { requireAuth, sanitizeUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  return ok({ user: sanitizeUser(auth.user) });
}
