import { connectDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Ticket } from "@/lib/models/Ticket";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAuth({ roles: ["ADMIN", "OWNER"] });
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  await connectDb();
  const tickets = await Ticket.find({}).sort({ updatedAt: -1 }).lean();

  return ok({
    tickets: tickets.map((ticket) => ({
      id: String(ticket._id),
      ownerId: ticket.ownerId,
      ownerUsername: ticket.ownerUsername,
      ownerEmail: ticket.ownerEmail,
      category: ticket.category,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt
    }))
  });
}
