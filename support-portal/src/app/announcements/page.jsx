"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";

export default function AnnouncementsPage() {
  return (
    <AuthGuard>
      {(user) => <AnnouncementsContent user={user} />}
    </AuthGuard>
  );
}

function AnnouncementsContent({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");

  async function loadAnnouncements() {
    const response = await fetch("/api/admin/announcements", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setError(data.message || "Unable to load announcements");
      return;
    }

    setAnnouncements(data.announcements);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  return (
    <main>
      <TopBar user={user} />
      <section className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Announcements</h2>
          <button className="button-secondary" onClick={loadAnnouncements}>Refresh</button>
        </div>

        {error ? <p className="mb-3 text-rose-300">{error}</p> : null}

        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-sm text-emerald-100/60">No announcements yet.</p>
          ) : (
            announcements.map((item) => (
              <article key={item.id} className="rounded-xl border border-emerald-200/15 bg-black/20 p-4">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mb-2 text-xs text-emerald-100/60">
                  Posted by {item.createdByUsername} on {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap text-sm text-emerald-50">{item.body}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
