"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function TopBar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/announcements", label: "Announcements" }
  ];

  if (user.role === "ADMIN" || user.role === "OWNER") {
    links.push({ href: "/admin", label: "Admin Console" });
  }

  return (
    <header className="mb-6 panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/60">Icongens Support</p>
          <h1 className="text-xl font-bold text-white">Welcome, {user.username}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`button ${
                pathname === link.href ? "button-primary" : "button-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button type="button" onClick={logout} className="button-danger">
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
