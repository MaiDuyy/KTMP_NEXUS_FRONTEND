"use client"
import { useEffect, useState } from "react";
import Header from "./components/layout/Header";
import HeroSection from "./components/layout/HeroSection";
import Footer from "./components/layout/Footer";
import FloatingButton from "./components/layout/FloatingButton";

export default function Home() {
  // Initialize dark mode state. 
  // In a real app, we might check localStorage or system preference here.
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Apply 'dark' class to html element when state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <HeroSection />
      </main>

      <Footer />
      <FloatingButton />
    </div>
  );
}
