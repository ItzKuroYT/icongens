"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying email...");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Verification token missing");
      setStatus("");
      return;
    }

    async function verify() {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.message || "Verification failed");
        setStatus("");
        return;
      }

      setStatus("Email verified. Redirecting to log in...");
      window.setTimeout(() => {
        router.replace("/auth?verified=1");
      }, 1200);
    }

    verify();
  }, [router, searchParams]);

  return (
    <main className="mx-auto mt-16 max-w-xl panel p-6">
      {status ? <p className="text-emerald-200">{status}</p> : null}
      {error ? <p className="text-rose-300">{error}</p> : null}
    </main>
  );
}
