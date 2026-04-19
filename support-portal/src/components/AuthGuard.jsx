"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children, roles = null, fallbackPath = "/auth" }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const roleSet = useMemo(() => (roles ? new Set(roles) : null), [roles]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          router.replace(fallbackPath);
          return;
        }

        if (roleSet && !roleSet.has(data.user.role)) {
          router.replace("/dashboard");
          return;
        }

        setSession(data.user);
      } catch (error) {
        if (mounted) {
          router.replace(fallbackPath);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [fallbackPath, roleSet, router]);

  if (loading) {
    return <div className="panel p-6 text-sm text-emerald-100/80">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return children(session);
}
