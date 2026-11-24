"use client";

import { useState, type FormEvent } from "react";
import { API_URL, errorDetail, errorMessage, saveToken } from "../lib/api";

// Must match MIN_PASSWORD_LENGTH in backend/config.py
const MIN_PASSWORD_LENGTH = 12;
const INPUT_CLASS =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400";

type RegistrationProps = {
  onAuthenticated: () => void;
};

type AuthMode = "login" | "register";

export default function Registration({ onAuthenticated }: RegistrationProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (mode === "register" && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(errorDetail(data, "Authentication failed."));
      }

      if (mode === "login") {
        saveToken(data.access_token);
        onAuthenticated();
      } else {
        setMode("login");
        setPassword("");
        setNotice("Registration successful. Log in with your new credentials.");
      }
    } catch (requestError) {
      setError(errorMessage(requestError, "Authentication failed."));
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <input required value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-300">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT_CLASS} />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Password
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={INPUT_CLASS} />
          </label>

          {mode === "register" && <p className="-mt-2 text-xs text-slate-500">Use at least {MIN_PASSWORD_LENGTH} characters.</p>}
          {notice && <p className="text-sm text-emerald-400" role="status">{notice}</p>}
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button type="button" onClick={switchMode} className="mt-6 w-full text-center text-sm text-blue-400 hover:text-blue-300">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
