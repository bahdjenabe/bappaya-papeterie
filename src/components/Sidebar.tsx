"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";

/**
 * Sidebar simplifiée pour BappayaPapeterie
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { userData } = useRequireAuth(); // 🔥 récupération rôle

  const isActive = (href: string) => pathname === href;

  const menuItems = [
    { href: "/dashboard", label: "📊 Tableau de bord" },
    { href: "/dashboard/stock", label: "📦 Stock" },
    { href: "/dashboard/sales", label: "💰 Ventes" },
    // 🔥 affiché seulement si admin
    ...(userData?.role === "admin"
      ? [{ href: "/dashboard/users", label: "👥 Utilisateurs" }]
      : []),
    { href: "/dashboard/reports", label: "📈 Rapports" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-white border-r border-blue-100 shadow-sm hidden lg:flex flex-col">
      {/* LOGO */}
      <div className="p-6 flex items-center gap-3 border-b border-blue-100">
        <span className="text-3xl">🏪</span>
        <span className="font-extrabold text-black text-lg tracking-wide">
          BappayaPapeterie
        </span>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-white/70 hover:text-blue-600"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full"></span>
              )}
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 text-xs text-slate-400 border-t border-blue-100">
        © 2026 BappayaPapeterie
      </div>
    </aside>
  );
}
