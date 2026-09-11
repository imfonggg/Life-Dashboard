"use client";
import './globals.css';
import { LoadingScreen } from './components/LoadingScreen';
import {useState} from "react";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  return (<>
    {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
  </>);
}
