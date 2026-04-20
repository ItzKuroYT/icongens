import { connectDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Ticket } from "@/lib/models/Ticket";
import { fail, ok } from "@/lib/http";

function canManageTicket(user, ticket) {
  const isAdmin = user.role === "ADMIN" || user.role === "OWNER";
  const isOwner = ticket.ownerId === String(user._id);
  return { isAdmin, isOwner };
}

export async function GET(_request, { params }) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  await connectDb();
  const ticket = await Ticket.findById(params.id).lean();
  if (!ticket) {
    return fail("Ticket not found", 404);
  }

  const { isAdmin, isOwner } = canManageTicket(auth.user, ticket);
  if (!isAdmin && !isOwner) {
    return fail("Forbidden", 403);
  }

  return ok({
    ticket: {
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
      closedAt: ticket.closedAt,
      reopenedAt: ticket.reopenedAt
    }
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  const payload = await request.json().catch(() => null);
  const nextStatus = payload && typeof payload.status === "string" ? payload.status : "";
  if (!["OPEN", "CLOSED", "PENDING"].includes(nextStatus)) {
    return fail("Invalid status", 400);
  }

  await connectDb();
  const ticket = await Ticket.findById(params.id);
  if (!ticket) {
    return fail("Ticket not found", 404);
  }

  const { isAdmin, isOwner } = canManageTicket(auth.user, ticket);
  if (!isAdmin && !isOwner) {
    return fail("Forbidden", 403);
  }

  const ownerChangingToForbiddenState =
    isOwner && !isAdmin && !(nextStatus === "CLOSED" || nextStatus === "OPEN");
  if (ownerChangingToForbiddenState) {
    return fail("Owners can only close or reopen their own tickets", 403);
  }

  ticket.status = nextStatus;
  if (nextStatus === "CLOSED") {
    ticket.closedAt = new Date();
  }
  if (nextStatus === "OPEN") {
    ticket.reopenedAt = new Date();
  }

  await ticket.save();

  return ok({
    ticket: {
      id: String(ticket._id),
      status: ticket.status,
      closedAt: ticket.closedAt,
      reopenedAt: ticket.reopenedAt,
      updatedAt: ticket.updatedAt
    }
  });
}

export async function DELETE(_request, { params }) {
  const auth = await requireAuth({ roles: ["ADMIN", "OWNER"] });
  if (!auth.ok) {
    return fail(auth.message, auth.status);
  }

  await connectDb();
  const deletion = await Ticket.deleteOne({ _id: params.id });
  if (!deletion.deletedCount) {
    return fail("Ticket not found", 404);
  }

  return ok({ message: "Ticket deleted" });
}
