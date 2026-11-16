"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FONT_KEY = "bk-a11y-font";
const CONTRAST_KEY = "bk-a11y-contrast";

type FontSize = "normal" | "large" | "xlarge";

const FONT_CLASS: Record<FontSize, string> = {
  normal: "",
  large: "a11y-font-large",
  xlarge: "a11y-font-xlarge",
};

function applyFont(size: FontSize) {
  const root = document.documentElement;
  root.classList.remove("a11y-font-large", "a11y-font-xlarge");
  if (FONT_CLASS[size]) root.classList.add(FONT_CLASS[size]);
}

function applyContrast(enabled: boolean) {
  document.documentElement.classList.toggle("a11y-contrast", enabled);
}

export function AccessibilityToolbar({ className }: { className?: string }) {
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [contrast, setContrast] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedFont = window.localStorage.getItem(FONT_KEY) as FontSize | null;
      const storedContrast = window.localStorage.getItem(CONTRAST_KEY) === "1";
      const nextFont: FontSize =
        storedFont === "large" || storedFont === "xlarge" ? storedFont : "normal";
      setFontSize(nextFont);
      setContrast(storedContrast);
      applyFont(nextFont);
      applyContrast(storedContrast);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const changeFont = (size: FontSize) => {
    setFontSize(size);
    applyFont(size);
    try {
      window.localStorage.setItem(FONT_KEY, size);
    } catch {
      // ignore
    }
  };

  const toggleContrast = () => {
    const next = !contrast;
    setContrast(next);
    applyContrast(next);
    try {
      window.localStorage.setItem(CONTRAST_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn("a11y-toolbar flex items-center gap-2 no-print", className)}
      role="group"
      aria-label="Ustawienia dostępności"
    >
      <div
        className="inline-flex items-stretch rounded-md border border-gray-300 bg-[#F3F4F6] overflow-hidden shadow-sm"
        role="group"
        aria-label="Rozmiar czcionki"
      >
        <button
          type="button"
          onClick={() => changeFont("normal")}
          aria-label="Standardowy rozmiar czcionki"
          aria-pressed={ready ? fontSize === "normal" : undefined}
          className={cn(
            "min-w-[2.25rem] px-2.5 py-1.5 text-sm font-bold text-[#1e3a5f] hover:bg-white focus-visible:z-10",
            fontSize === "normal" && "bg-white"
          )}
        >
          A
        </button>
        <button
          type="button"
          onClick={() => changeFont("large")}
          aria-label="Powiększony rozmiar czcionki"
          aria-pressed={ready ? fontSize === "large" : undefined}
          className={cn(
            "min-w-[2.25rem] px-2.5 py-1.5 text-sm font-bold text-[#1e3a5f] border-l border-gray-300 hover:bg-white focus-visible:z-10",
            fontSize === "large" && "bg-white"
          )}
        >
          A+
        </button>
        <button
          type="button"
          onClick={() => changeFont("xlarge")}
          aria-label="Największy rozmiar czcionki"
          aria-pressed={ready ? fontSize === "xlarge" : undefined}
          className={cn(
            "min-w-[2.5rem] px-2.5 py-1.5 text-sm font-bold text-[#1e3a5f] border-l border-gray-300 hover:bg-white focus-visible:z-10",
            fontSize === "xlarge" && "bg-white"
          )}
        >
          A++
        </button>
      </div>

      <button
        type="button"
        onClick={toggleContrast}
        aria-label={contrast ? "Wyłącz wysoki kontrast" : "Włącz wysoki kontrast"}
        aria-pressed={ready ? contrast : undefined}
        title="Wysoki kontrast"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-[#F3F4F6] shadow-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145447]",
          contrast && "ring-2 ring-black ring-offset-1"
        )}
      >
        <span
          className="block h-5 w-5 rounded-full overflow-hidden border border-gray-500"
          aria-hidden="true"
        >
          <span className="flex h-full w-full">
            <span className="w-1/2 bg-white" />
            <span className="w-1/2 bg-black" />
          </span>
        </span>
      </button>
    </div>
  );
}

/** Inline script — apply saved prefs before first paint (no FOUC). */
export const a11yBootstrapScript = `(function(){try{var f=localStorage.getItem('${FONT_KEY}');var c=localStorage.getItem('${CONTRAST_KEY}');var r=document.documentElement;r.classList.remove('a11y-font-large','a11y-font-xlarge','a11y-contrast');if(f==='large')r.classList.add('a11y-font-large');else if(f==='xlarge')r.classList.add('a11y-font-xlarge');if(c==='1')r.classList.add('a11y-contrast');}catch(e){}})();`;
