import { requireAuth } from "@/lib/auth";
import { emailSchema, validate } from "@/lib/validators";
import { fail, ok } from "@/lib/http";
import { sendEmail } from "@/lib/email";

export async function POST(request) {
  const auth = await requireAuth({ roles: ["ADMIN", "OWNER"] });
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  const payload = await request.json().catch(() => null);
  const parsed = validate(emailSchema, payload || {});
  if (!parsed.ok) {
    return fail("Invalid email payload", 400, parsed.errors);
  }

  try {
    await sendEmail({
      to: parsed.data.to,
      subject: parsed.data.subject,
      html: `<p>${parsed.data.content.replace(/\n/g, "<br/>")}</p>`,
      text: parsed.data.content
    });
  } catch (error) {
    return fail("Email not found or unable to send", 400);
  }

  return ok({ message: "Email sent" });
}
