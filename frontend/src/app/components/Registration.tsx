"use client";

import { FormEvent, useState } from "react";
import BillsAndBudgetPage from "./BillsAndBudget";
import { Sidebar } from "./sections/Sidebar";

type AuthMode = "login" | "register";

export default function Registration() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (mode === "register" && password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Authentication failed.");
      }

      localStorage.setItem("access_token", data.access_token);
      setIsAuthenticated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="flex-1">
          <BillsAndBudgetPage />
        </main>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Life Dashboard</p>
        <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-slate-400">
          {mode === "login" ? "Sign in to view your financial dashboard." : "Start organizing your finances in one place."}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block text-sm font-medium text-slate-300">
              Name
              <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400" />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-300">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400" />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Password
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400" />
          </label>

          {mode === "register" && <p className="-mt-2 text-xs text-slate-500">Use at least 12 characters.</p>}
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-6 w-full text-center text-sm text-blue-400 hover:text-blue-300">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
