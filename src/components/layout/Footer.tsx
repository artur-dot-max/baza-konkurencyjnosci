import * as React from "react"
import Link from "next/link"
import { PRODUCT_RELEASE } from "@/lib/product-info"

export function Footer() {
  return (
    <footer className="bg-[#145447] text-white mt-auto border-t border-[#0f3d34]">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h2 className="font-bold text-[#B8DB8F] mb-4 text-lg">System</h2>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link href="/o-systemie" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">O systemie</Link></li>
              <li><Link href="/faq" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Często zadawane pytania (FAQ)</Link></li>
              <li><Link href="/ogloszenia" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Baza Konkurencyjności</Link></li>
              <li><Link href="/instrukcja-uzytkownika" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Instrukcja użytkownika</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-[#B8DB8F] mb-4 text-lg">Prawne</h2>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link href="/regulamin" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Regulamin</Link></li>
              <li><Link href="/polityka-prywatnosci" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Polityka prywatności</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-[#B8DB8F] mb-4 text-lg">Kontakt</h2>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link href="/kontakt" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Skontaktuj się z nami</Link></li>
              <li><Link href="/kontakt" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Dane kontaktowe</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-[#B8DB8F] mb-4 text-lg">Dostępność</h2>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><Link href="/deklaracja-dostepnosci" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Deklaracja dostępności</Link></li>
              <li><Link href="/deklaracja-dostepnosci#informacje-zwrotne" className="hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F] rounded">Zgłoś brak dostępności</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-[#0f3d34] py-4 text-gray-300">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© 2026 Fundusz Sprawiedliwości. <span className="whitespace-nowrap">Wersja {PRODUCT_RELEASE}</span></p>
        </div>
      </div>
    </footer>
  )
}
