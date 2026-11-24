"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import Registration from "../components/Registration";
import { Sidebar } from "../components/sections/Sidebar";
import { API_URL, authHeaders, clearToken, getToken } from "../lib/api";

/**
 * Wraps every dashboard page. Order of screens:
 * typing animation -> checking the saved login -> login form (if needed) -> sidebar + page.
 */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Stops state updates if the layout unmounts before the check finishes
    let isActive = true;

    const checkSession = async () => {
      const token = getToken();

      if (!token) {
        if (isActive) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, { headers: authHeaders(token) });

        if (isActive) {
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            clearToken();
          }
        }
      } catch (error) {
        console.error("Unable to verify the saved login session:", error);
        if (isActive) {
          clearToken();
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