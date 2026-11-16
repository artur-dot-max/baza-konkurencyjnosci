import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/logowanie");
  if (session.user.role !== "CONTRACTOR" && session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto max-w-5xl px-4 py-8 flex-1">
        <nav className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/wykonawca" className="font-medium text-[#145447] hover:underline">Moje oferty</Link>
          <Link href="/wykonawca/konto" className="font-medium text-[#145447] hover:underline">Ustawienia konta</Link>
          <Link href="/ogloszenia" className="font-medium text-gray-600 hover:underline">Przeglądaj ogłoszenia</Link>
        </nav>
        <main id="main-content">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
