"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";

type Theme = "dark" | "light";
const STORAGE_KEY = "sp-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  };

  if (!theme) return <div className="w-9 h-9" aria-hidden />;

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors"
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Icon.Sun size={18} /> : <Icon.Moon size={18} />}
    </button>
  );
}
