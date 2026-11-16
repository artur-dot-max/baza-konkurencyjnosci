"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bk-cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      acceptRef.current?.focus();
    }
  }, [visible]);

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ acceptedAt: new Date().toISOString() }));
    } catch {
      // ignore storage errors (private mode etc.)
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Informacja o plikach cookies"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-4xl rounded-lg border border-[#0f3d34]/30 bg-white shadow-xl">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="flex-1 text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold text-[#145447] mb-1">Pliki cookies</p>
            <p>
              Ta strona wykorzystuje niezbędne pliki cookies do prawidłowego działania systemu
              (m.in. sesja logowania i preferencje). Szczegóły znajdziesz w{" "}
              <Link href="/polityka-prywatnosci" className="font-medium text-[#145447] underline hover:no-underline">
                Polityce prywatności
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              ref={acceptRef}
              type="button"
              onClick={accept}
              className="bg-[#145447] hover:bg-[#0D4036] text-white"
            >
              Akceptuję
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
