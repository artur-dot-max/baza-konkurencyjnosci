"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FileEdit,
  Archive,
  Building2,
  Menu,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/panel", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/panel/ogloszenia", icon: FileText, label: "Moje ogłoszenia" },
  { href: "/panel/nowe-ogloszenie", icon: PlusCircle, label: "Dodaj ogłoszenie", write: true },
  { href: "/panel/szkice", icon: FileEdit, label: "Szkice", write: true },
  { href: "/panel/archiwum", icon: Archive, label: "Archiwum" },
  { href: "/panel/profil", icon: Building2, label: "Profil organizacji" },
  { href: "/panel/zespol", icon: Users, label: "Zespół" },
  { href: "/panel/konto", icon: Shield, label: "Ustawienia konta" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const isViewer = session?.user?.role === "ORGANIZATION" && session.user.orgRole === "VIEWER";
  const visibleItems = menuItems.filter((item) => !(item.write && isViewer));

  return (
    <>
      <div className="md:hidden p-4 bg-navy-800 text-white flex justify-between items-center w-full absolute z-20">
        <span className="font-bold">Panel Organizacji</span>
        <Button variant="ghost" size="icon" aria-label="Menu panelu" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)} className="text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <aside
        className={cn(
          "bg-navy-800 text-white w-64 flex-shrink-0 flex-col transition-transform duration-300 md:translate-x-0 md:static md:flex",
          "fixed inset-y-0 left-0 z-10 pt-16 md:pt-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 hidden md:block border-b border-navy-700">
          <h2 className="text-xl font-bold tracking-tight">Panel Organizacji</h2>
          {isViewer && <p className="text-xs text-gray-400 mt-1">Rola: tylko podgląd</p>}
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/panel"
                ? pathname === "/panel"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8DB8F]",
                  isActive
                    ? "bg-navy-700 text-white"
                    : "text-gray-300 hover:bg-navy-700 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
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
        />
      )}
    </>
  );
}
