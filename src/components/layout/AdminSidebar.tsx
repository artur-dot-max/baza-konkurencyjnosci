"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ScrollText,
  Newspaper,
  Bug,
  Mail,
  Shield,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: Users },
  { href: "/admin/organizacje", label: "Organizacje", icon: Building2 },
  { href: "/admin/ogloszenia", label: "Ogłoszenia", icon: FileText },
  { href: "/admin/aktualnosci", label: "Aktualności", icon: Newspaper },
  { href: "/admin/dziennik-zdarzen", label: "Dziennik zdarzeń", icon: ScrollText },
  { href: "/admin/dziennik-bledow", label: "Dziennik błędów", icon: Bug },
  { href: "/admin/wiadomosci", label: "Wiadomości", icon: Mail },
  { href: "/admin/konto", label: "Ustawienia konta", icon: Shield },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden p-4 bg-navy-900 text-white flex justify-between items-center w-full absolute z-20">
        <span className="font-bold">Panel administratora</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu panelu administratora"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="text-white"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <aside
        className={cn(
          "bg-navy-900 text-white w-64 flex-shrink-0 flex-col transition-transform duration-300 md:translate-x-0 md:static md:flex",
          "fixed inset-y-0 left-0 z-10 pt-16 md:pt-0 min-h-full",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 hidden md:block border-b border-navy-800">
          <h2 className="text-xl font-bold tracking-tight">Administrator</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F]",
                  isActive
                    ? "bg-navy-800 text-white font-medium"
                    : "text-gray-300 hover:bg-navy-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 md:hidden pt-16"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
