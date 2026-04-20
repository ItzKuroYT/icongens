"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import TicketStatusBadge from "@/components/TicketStatusBadge";
import TicketCategoryBadge from "@/components/TicketCategoryBadge";

export default function AdminPage() {
  return (
    <AuthGuard roles={["ADMIN", "OWNER"]}>
      {(user) => <AdminContent user={user} />}
    </AuthGuard>
  );
}

function AdminContent({ user }) {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", content: "" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", emailBroadcast: false });

  async function loadAll() {
    const [uRes, tRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/tickets", { cache: "no-store" })
    ]);

    const [uData, tData] = await Promise.all([uRes.json(), tRes.json()]);

    if (!uRes.ok || !uData.ok || !tRes.ok || !tData.ok) {
      setError("Failed to load admin data");
      return;
    }

    setUsers(uData.users);
    setTickets(tData.tickets);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateUserRole(userId, role) {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to update role");
      return;
    }
    await loadAll();
  }

  async function setTicketStatus(ticketId, status) {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to update ticket");
      return;
    }
    await loadAll();
  }

  async function deleteTicket(ticketId) {
    const response = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to delete ticket");
      return;
    }
    await loadAll();
  }

  async function sendAdminEmail(event) {
    event.preventDefault();
    const response = await fetch("/api/admin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailForm)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to send email");
      return;
    }

    setEmailForm({ to: "", subject: "", content: "" });
  }

  async function publishAnnouncement(event) {
    event.preventDefault();
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcementForm)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to post announcement");
      return;
    }

    setAnnouncementForm({ title: "", body: "", emailBroadcast: false });
  }

  return (
    <main>
      <TopBar user={user} />
      {error ? <p className="mb-4 rounded-lg border border-rose-300/30 bg-rose-950/50 p-3 text-rose-200">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-lg font-bold">Users</h2>
          <div className="space-y-3">
            {users.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-emerald-200/15 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{entry.username}</p>
                    <p className="text-xs text-emerald-100/60">{entry.email}</p>
                  </div>
                  <select
                    className="input w-32"
                    value={entry.role}
                    onChange={(e) => updateUserRole(entry.id, e.target.value)}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-lg font-bold">All Tickets</h2>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-xl border border-emerald-200/15 bg-black/20 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketCategoryBadge category={ticket.category} />
                </div>
                <p className="font-semibold text-white">{ticket.subject}</p>
                <p className="text-xs text-emerald-100/60">{ticket.ownerUsername} • {ticket.ownerEmail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="button-secondary" onClick={() => setTicketStatus(ticket.id, "OPEN")}>Reopen</button>
                  <button className="button-primary" onClick={() => setTicketStatus(ticket.id, "PENDING")}>Pending</button>
                  <button className="button-danger" onClick={() => setTicketStatus(ticket.id, "CLOSED")}>Close</button>
                  <button className="button-danger" onClick={() => deleteTicket(ticket.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-lg font-bold">Send Email (Admin Console)</h2>
          <form className="space-y-3" onSubmit={sendAdminEmail}>
            <input className="input" type="email" placeholder="Recipient email" value={emailForm.to} onChange={(e) => setEmailForm((f) => ({ ...f, to: e.target.value }))} required />
            <input className="input" placeholder="Subject" value={emailForm.subject} onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))} required />
            <textarea className="input min-h-24" placeholder="Message" value={emailForm.content} onChange={(e) => setEmailForm((f) => ({ ...f, content: e.target.value }))} required />
            <button className="button-primary">Send Email</button>
          </form>
        </section>

        <section className="panel p-5">
          <h2 className="mb-3 text-lg font-bold">Create Announcement</h2>
          <form className="space-y-3" onSubmit={publishAnnouncement}>
            <input className="input" placeholder="Announcement title" value={announcementForm.title} onChange={(e) => setAnnouncementForm((f) => ({ ...f, title: e.target.value }))} required />
            <textarea className="input min-h-24" placeholder="Announcement body" value={announcementForm.body} onChange={(e) => setAnnouncementForm((f) => ({ ...f, body: e.target.value }))} required />
            <label className="flex items-center gap-2 text-sm text-emerald-100/70">
              <input type="checkbox" checked={announcementForm.emailBroadcast} onChange={(e) => setAnnouncementForm((f) => ({ ...f, emailBroadcast: e.target.checked }))} />
              Email this announcement to verified users
            </label>
            <button className="button-primary">Publish Announcement</button>
          </form>
        </section>
      </div>
    </main>
  );
}
