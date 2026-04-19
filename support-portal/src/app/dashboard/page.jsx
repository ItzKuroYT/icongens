"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import TicketCategoryBadge from "@/components/TicketCategoryBadge";

const initialForm = {
  category: "GENERAL_SUPPORT",
  subject: "",
  message: ""
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(user) => <DashboardContent user={user} />}
    </AuthGuard>
  );
}

function DashboardContent({ user }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadTickets() {
    const response = await fetch("/api/tickets", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to load tickets");
      return;
    }

    setTickets(data.tickets);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function createTicket(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to create ticket");
      return;
    }

    setForm(initialForm);
    await loadTickets();
  }

  return (
    <main>
      <TopBar user={user} />

      <div className="grid gap-5 lg:grid-cols-[360px,1fr]">
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Create Ticket</h2>
          <p className="mb-4 text-sm text-emerald-100/70">
            Categories: General Support, Bug Reports, Appeals, Player Reports.
          </p>
          {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
          <form className="space-y-3" onSubmit={createTicket}>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="GENERAL_SUPPORT">General Support</option>
              <option value="BUG_REPORT">Bug Reports</option>
              <option value="APPEAL">Appeals</option>
              <option value="PLAYER_REPORT">Player Reports</option>
            </select>
            <input
              className="input"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Ticket Subject"
              required
            />
            <textarea
              className="input min-h-36"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Describe your issue"
              required
            />
            <button className="button-primary w-full" disabled={loading}>
              {loading ? "Submitting..." : "Create Ticket"}
            </button>
          </form>
        </section>

        <section className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">My Tickets</h2>
            <button type="button" className="button-secondary" onClick={loadTickets}>
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-emerald-100/60">No tickets yet.</p>
            ) : (
              tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-xl border border-emerald-200/15 bg-black/20 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <TicketStatusBadge status={ticket.status} />
                    <TicketCategoryBadge category={ticket.category} />
                  </div>
                  <h3 className="font-semibold text-white">{ticket.subject}</h3>
                  <p className="mt-1 text-xs text-emerald-100/60">
                    Updated {new Date(ticket.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-3">
                    <Link href={`/tickets/${ticket.id}`} className="button-primary">
                      Open Ticket
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
