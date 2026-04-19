import { connectDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Ticket } from "@/lib/models/Ticket";
import { ticketCreateSchema, validate } from "@/lib/validators";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  await connectDb();

  const query =
    auth.user.role === "ADMIN" || auth.user.role === "OWNER"
      ? {}
      : { ownerId: String(auth.user._id) };

  const tickets = await Ticket.find(query).sort({ updatedAt: -1 }).lean();

  return ok({
    tickets: tickets.map((ticket) => ({
      id: String(ticket._id),
      ownerId: ticket.ownerId,
      ownerUsername: ticket.ownerUsername,
      ownerEmail: ticket.ownerEmail,
      category: ticket.category,
      subject: ticket.subject,
      status: ticket.status,
      messages: ticket.messages,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt
    }))
  });
}

export async function POST(request) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  const payload = await request.json().catch(() => null);
  const parsed = validate(ticketCreateSchema, payload || {});
  if (!parsed.ok) {
    return fail("Invalid ticket payload", 400, parsed.errors);
  }

  await connectDb();

  const ticket = await Ticket.create({
    ownerId: String(auth.user._id),
    ownerUsername: auth.user.username,
    ownerEmail: auth.user.email,
    category: parsed.data.category,
    subject: parsed.data.subject,
    status: "OPEN",
    messages: [
      {
        authorId: String(auth.user._id),
        authorRole: auth.user.role,
        authorLabel: auth.user.username,
        body: parsed.data.message,
        createdAt: new Date()
      }
    ]
  });

  return ok(
    {
      ticket: {
        id: String(ticket._id),
        category: ticket.category,
        subject: ticket.subject,
        status: ticket.status,
        messages: ticket.messages,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      }
    },
    201
  );
}
