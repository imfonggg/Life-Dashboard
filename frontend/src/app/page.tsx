"use client";
import './globals.css';
import { LoadingScreen } from './components/LoadingScreen';
import { Home as HomePage } from './components/Home';
import Registration from './components/Registration';
import { Sidebar } from './components/sections/Sidebar';
import { useState } from 'react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}

      {isLoaded && (
        <div className="flex min-h-screen bg-slate-950 text-white">
          <Sidebar onLogin={() => setShowLogin(true)} />
          <main className="flex-1">
            {showLogin ? (
              <Registration onAuthenticated={() => setShowLogin(false)} />
            ) : (
              <HomePage />
            )}
          </main>
        </div>
      )}
    </>
  );
}
