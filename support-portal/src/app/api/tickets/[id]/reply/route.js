import { connectDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Ticket } from "@/lib/models/Ticket";
import { ticketReplySchema, validate } from "@/lib/validators";
import { fail, ok } from "@/lib/http";
import { sendEmail } from "@/lib/email";

function isAdmin(role) {
  return role === "ADMIN" || role === "OWNER";
}

export async function POST(request, { params }) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  const payload = await request.json().catch(() => null);
  const parsed = validate(ticketReplySchema, payload || {});
  if (!parsed.ok) {
    return fail("Invalid reply payload", 400, parsed.errors);
  }

  await connectDb();
  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    return fail("Ticket not found", 404);
  }

  const canAccess =
    isAdmin(auth.user.role) || ticket.ownerId === String(auth.user._id);
  if (!canAccess) {
    return fail("Forbidden", 403);
  }

  ticket.messages.push({
    authorId: String(auth.user._id),
    authorRole: auth.user.role,
    authorLabel: auth.user.username,
    body: parsed.data.message,
    createdAt: new Date()
  });

  if (parsed.data.status) {
    if (!isAdmin(auth.user.role) && parsed.data.status === "PENDING") {
      return fail("Only admins can mark pending", 403);
    }
    ticket.status = parsed.data.status;
    if (parsed.data.status === "CLOSED") {
      ticket.closedAt = new Date();
    }
    if (parsed.data.status === "OPEN") {
      ticket.reopenedAt = new Date();
    }
  }

  await ticket.save();

  if (isAdmin(auth.user.role)) {
    try {
      await sendEmail({
        to: ticket.ownerEmail,
        subject: `Ticket Update: ${ticket.subject}`,
        html: `<p>Your ticket has a new reply from support.</p><p>${parsed.data.message}</p>`,
        text: `Your ticket has a new reply from support: ${parsed.data.message}`
      });
    } catch (error) {
      // Notification errors should not block support workflow.
    }
  }

  return ok({
    ticket: {
      id: String(ticket._id),
      status: ticket.status,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages
    }
  });
}
