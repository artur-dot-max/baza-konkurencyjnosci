import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import { auth, signOut } from "@/auth"
import { AccessibilityToolbar } from "@/components/accessibility-toolbar"
import { Button } from "@/components/ui/button"
import { NotificationsBell } from "@/components/notifications-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function panelHref(role?: string) {
  if (role === "ADMIN") return "/admin"
  if (role === "CONTRACTOR") return "/wykonawca"
  return "/panel"
}

function settingsHref(role?: string) {
  if (role === "ADMIN") return "/admin/konto"
  if (role === "CONTRACTOR") return "/wykonawca/konto"
  return "/panel/konto"
}

function panelLabel(role?: string) {
  if (role === "ADMIN") return "Panel administratora"
  if (role === "CONTRACTOR") return "Panel wykonawcy"
  return "Panel zamawiającego"
}

export async function Header() {
  const session = await auth()

  return (
    <header className="w-full bg-[#145447] text-white">
      <div className="bg-[#E8EEF5] border-b border-gray-300 no-print">
        <div className="container mx-auto max-w-6xl px-4 py-1.5 flex items-center justify-end">
          <AccessibilityToolbar />
        </div>
      </div>
      <div className="h-1 bg-[#B8DB8F] w-full" aria-hidden="true" />
      <div className="container mx-auto max-w-6xl px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
            <span className="hidden sm:block font-bold text-lg leading-tight">
              Baza Konkurencyjności
            </span>
            <Image
              src="/logo-fundusz-sprawiedliwosci-biale.png"
              alt="Fundusz Sprawiedliwości"
              width={230}
              height={92}
              priority
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6" aria-label="Nawigacja główna">
          <Link href="/ogloszenia" className="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-2 py-1">
            Ogłoszenia
          </Link>
          <Link href="/aktualnosci" className="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-2 py-1">
            Aktualności
          </Link>
          <Link href="/o-systemie" className="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-2 py-1">
            O Systemie
          </Link>
          <Link href="/faq" className="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-2 py-1">
            FAQ
          </Link>
          <Link href="/kontakt" className="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded px-2 py-1">
            Kontakt
          </Link>

          {session ? (
            <div className="flex items-center gap-1">
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                    Moje konto
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Zalogowano jako {session.user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={panelHref(session.user.role)}>{panelLabel(session.user.role)}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={settingsHref(session.user.role)}>Ustawienia</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={async () => {
                      "use server"
                      await signOut()
                    }}>
                      <button type="submit" className="w-full text-left">Wyloguj się</button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/logowanie">Zaloguj się</Link>
              </Button>
              <Button asChild className="bg-[#B8DB8F] hover:bg-[#A7CC7D] text-[#123F36] border-none">
                <Link href="/rejestracja">Załóż konto</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Nav Trigger */}
        <div className="md:hidden flex items-center gap-1">
          {session && <NotificationsBell />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white" aria-label="Menu główne">
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem asChild>
                <Link href="/ogloszenia" className="w-full">Ogłoszenia</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/aktualnosci" className="w-full">Aktualności</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/o-systemie" className="w-full">O Systemie</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/faq" className="w-full">FAQ</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/kontakt" className="w-full">Kontakt</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {session ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={panelHref(session.user.role)} className="w-full">{panelLabel(session.user.role)}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={settingsHref(session.user.role)} className="w-full">Ustawienia konta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form action={async () => {
                      "use server"
                      await signOut()
                    }} className="w-full">
                      <button type="submit" className="w-full text-left">Wyloguj się</button>
                    </form>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/logowanie" className="w-full">Zaloguj się</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rejestracja" className="w-full">Załóż konto</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
