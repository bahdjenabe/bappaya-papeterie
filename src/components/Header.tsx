"use client";

import { signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { LogOut, Mail, Power, UserCircle, UserIcon } from "lucide-react"; // Icône déconnexion moderne

/**
 * Header du dashboard
 * Affiche :
 * - Barre de recherche
 * - Notifications
 * - Utilisateur connecté avec avatar
 * - Bouton de déconnexion stylé
 */
export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  // ⚡ Récupérer l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 🔓 Déconnexion
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <header className="h-16 bg-gradient-to-r from-blue-100 via-blue-50 to-white border-b flex items-center justify-between px-6 shadow-sm">
      {/* Barre de recherche */}
      <div className="relative w-80">
        <input
          type="text"
          placeholder="🔍 Rechercher des produits, ventes..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm bg-white"
        />
      </div>

      {/* Profil et notifications */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="text-gray-500 text-2xl hover:text-blue-600 transition">
          🔔
        </button>

        {/* Info utilisateur */}
        {user && (
          <div className="flex items-center gap-4 bg-white/90 px-3 py-1 rounded-full shadow-md">
            {/* Avatar + Dropdown */}
            <div className="relative">
              {/* Avatar */}
              <div
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition"
              >
                <UserIcon size={20} />
              </div>

              {/* Dropdown sous l’icône */}
              {open && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white shadow-xl rounded-xl border z-50 translate-x-[160px] overflow-hidden">
                  {/* Header utilisateur */}
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <UserIcon size={16} />
                      {user?.displayName || "Utilisateur"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <Mail size={14} />
                      {user?.email}
                    </p>
                  </div>

                  {/* Mon profil */}
                  <button
                    onClick={() => (window.location.href = "/dashboard/profil")}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition"
                  >
                    <UserCircle size={16} />
                    Mon profil
                  </button>

                  {/* Déconnexion */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-500 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <p className="text-gray-400 text-sm">{user?.email}</p>

            {/* Bouton logout rapide */}
            {/* <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition flex items-center justify-center"
            >
              <Power size={18} />
            </button> */}
          </div>
        )}
      </div>
    </header>
  );
}
