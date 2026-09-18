"use client";
import './globals.css';
import { LoadingScreen } from './components/LoadingScreen';
import { Sidebar } from './components/sections/Sidebar';
import BillsAndBudgetPage from './components/BillsAndBudget';
import { useState } from 'react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}

      {isLoaded && (
        <div className="flex min-h-screen bg-slate-950 text-white">
          <Sidebar />
          <main className="flex-1">
            <BillsAndBudgetPage />
          </main>
        </div>
      )}
    </>
  );
}
