"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function ThemeSwitcher() {
  const t = useTranslations("switcher");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("mda_theme") as "dark" | "light" | null;
    const initial = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("mda_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  };

  const isDark = theme === "dark";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full border-2 border-line bg-surface opacity-50" />
    );
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        className="w-10 h-10 rounded-full bg-surface-raised/90 hover:bg-surface-raised border-2 border-line hover:border-accent shadow-md backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary p-0 m-0"
      >
        <span aria-hidden="true" className="text-lg select-none">
          {isDark ? "☀️" : "🌙"}
        </span>
      </button>

      {/* Floating tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute top-full mt-2 end-0 hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-150 transform scale-95 group-hover:scale-100 px-3 py-1.5 rounded-xl bg-surface-raised border-2 border-line text-xs font-bold text-ink shadow-lg whitespace-nowrap z-50"
      >
        <span>{label}</span>
      </div>
    </div>
  );
}
