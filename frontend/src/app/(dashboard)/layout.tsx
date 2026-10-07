"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import Registration from "../components/Registration";
import { Sidebar } from "../components/sections/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (isActive) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isActive) {
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("access_token");
          }
        }
      } catch (error) {
        console.error("Unable to verify the saved login session:", error);
        if (isActive) {
          localStorage.removeItem("access_token");
        }
      } finally {
        if (isActive) {
          setIsCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      isActive = false;
    };
  }, []);

  if (!isLoaded) {
    return <LoadingScreen onComplete={() => setIsLoaded(true)} />;
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Checking login...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Registration onAuthenticated={() => setIsAuthenticated(true)} />;
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