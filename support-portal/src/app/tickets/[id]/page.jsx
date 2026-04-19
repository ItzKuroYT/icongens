"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import TicketCategoryBadge from "@/components/TicketCategoryBadge";

export default function TicketDetailPage() {
  return (
    <AuthGuard>
      {(user) => <TicketDetailContent user={user} />}
    </AuthGuard>
  );
}

function TicketDetailContent({ user }) {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTicket() {
    const response = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to load ticket");
      return;
    }

    setTicket(data.ticket);
    setStatus(data.ticket.status);
  }

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function sendReply(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = { message: reply };
    if (status && status !== ticket.status) {
      payload.status = status;
    }

    const response = await fetch(`/api/tickets/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to send reply");
      return;
    }

    setReply("");
    await loadTicket();
  }

  async function changeStatus(nextStatus) {
    const response = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to change status");
      return;
    }

    await loadTicket();
  }

  return (
    <main>
      <TopBar user={user} />
      <div className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button className="button-secondary" onClick={() => router.push("/dashboard")}>Back</button>
          {ticket ? (
            <div className="flex flex-wrap items-center gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketCategoryBadge category={ticket.category} />
            </div>
          ) : null}
        </div>

        {error ? <p className="mb-3 text-rose-300">{error}</p> : null}

        {!ticket ? (
          <p className="text-emerald-100/70">Loading ticket...</p>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">{ticket.subject}</h2>
            <p className="mb-4 text-xs text-emerald-100/60">
              Created {new Date(ticket.createdAt).toLocaleString()} by {ticket.ownerUsername}
            </p>

            <div className="mb-5 space-y-3">
              {ticket.messages.map((message, idx) => (
                <article key={`${message.createdAt}-${idx}`} className="rounded-xl border border-emerald-200/15 bg-black/20 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-emerald-100/60">
                    <span>{message.authorLabel} ({message.authorRole})</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-emerald-50">{message.body}</p>
                </article>
              ))}
            </div>

            <form className="space-y-3" onSubmit={sendReply}>
              <textarea
                className="input min-h-28"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write your reply"
                required
              />
              <div className="flex flex-wrap items-center gap-2">
                <select className="input max-w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="OPEN">OPEN</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button className="button-primary" disabled={loading}>
                  {loading ? "Sending..." : "Send Reply"}
                </button>
                <button type="button" className="button-secondary" onClick={() => changeStatus("OPEN")}>Reopen</button>
                <button type="button" className="button-danger" onClick={() => changeStatus("CLOSED")}>Close</button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
