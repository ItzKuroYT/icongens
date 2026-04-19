"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const initialSignup = {
  username: "",
  email: "",
  password: ""
};

const initialLogin = {
  email: "",
  password: ""
};

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState(() =>
    searchParams.get("mode") === "login" ? "login" : "signup"
  );
  const [signup, setSignup] = useState(initialSignup);
  const [login, setLogin] = useState(initialLogin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(searchParams.get("verified") ? "Email verified. You can log in now." : "");

  const isSignup = useMemo(() => mode === "signup", [mode]);

  useEffect(() => {
    const nextMode = searchParams.get("mode") === "login" ? "login" : "signup";
    setMode(nextMode);
  }, [searchParams]);

  async function submitSignup(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup)
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      setInfo("Signup successful. Please verify your email before logging in.");
      setMode("login");
    } catch (err) {
      setError("Unable to create account right now");
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login)
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Unable to log in right now");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[75vh] max-w-5xl items-center gap-6 md:grid-cols-2">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/60">Secure Support Portal</p>
        <h1 className="text-4xl font-black leading-tight text-white">
          Tickets, moderation, and announcements in one place.
        </h1>
        <p className="text-emerald-100/70">
          Production-ready auth with hashed passwords, email verification, and role-based admin tools.
        </p>
      </section>

      <section className="panel p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`button ${isSignup ? "button-primary" : "button-secondary"}`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`button ${!isSignup ? "button-primary" : "button-secondary"}`}
          >
            Log In
          </button>
        </div>

        {error ? <p className="mb-3 text-sm font-semibold text-rose-300">{error}</p> : null}
        {info ? <p className="mb-3 text-sm font-semibold text-emerald-300">{info}</p> : null}

        {isSignup ? (
          <form className="space-y-3" onSubmit={submitSignup}>
            <input
              className="input"
              value={signup.username}
              onChange={(e) => setSignup((s) => ({ ...s, username: e.target.value }))}
              placeholder="Username"
              required
            />
            <input
              className="input"
              type="email"
              value={signup.email}
              onChange={(e) => setSignup((s) => ({ ...s, email: e.target.value }))}
              placeholder="Email"
              required
            />
            <input
              className="input"
              type="password"
              value={signup.password}
              onChange={(e) => setSignup((s) => ({ ...s, password: e.target.value }))}
              placeholder="Password"
              required
            />
            <button className="button-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={submitLogin}>
            <input
              className="input"
              type="email"
              value={login.email}
              onChange={(e) => setLogin((s) => ({ ...s, email: e.target.value }))}
              placeholder="Email"
              required
            />
            <input
              className="input"
              type="password"
              value={login.password}
              onChange={(e) => setLogin((s) => ({ ...s, password: e.target.value }))}
              placeholder="Password"
              required
            />
            <button className="button-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
