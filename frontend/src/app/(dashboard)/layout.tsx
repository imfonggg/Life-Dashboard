"use client";

import { useState, type ReactNode } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import Registration from "../components/Registration";
import { Sidebar } from "../components/sections/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (!isLoaded) {
    return <LoadingScreen onComplete={() => setIsLoaded(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar onLogin={() => setShowLogin(true)} />
      <main className="min-w-0 flex-1">
        {showLogin ? (
          <Registration onAuthenticated={() => setShowLogin(false)} />
        ) : (
          children
        )}
      </main>
    </div>
  );
}