"use client";

import { useEffect, useState } from "react";

const WELCOME_TEXT = "Welcome to Life Dashboard";
const TYPING_DELAY_MS = 100; // per letter
const PAUSE_AFTER_TYPING_MS = 1000;

type LoadingScreenProps = {
  onComplete: () => void;
};

/** Types out the welcome text one letter at a time, waits a moment, then calls onComplete. */
export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [text, setText] = useState("");

  useEffect(() => {
    let index = 0;
    let finishTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setText(WELCOME_TEXT.substring(0, index));
      index++;
      if (index > WELCOME_TEXT.length) {
        clearInterval(interval);
        finishTimeout = setTimeout(onComplete, PAUSE_AFTER_TYPING_MS);
      }
    }, TYPING_DELAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-gray-100">
      <div className="mb-4 font-mono text-4xl font-bold">
        {text}
        <span className="animate-blink ml-1">| </span>
      </div>
      <div className="relative h-[2px] w-[200px] overflow-hidden rounded bg-gray-800">
        <div className="animate-loading h-full w-[40%] bg-blue-500"></div>
      </div>
    </div>
  );
};
