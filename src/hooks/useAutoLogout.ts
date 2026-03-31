"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function useAutoLogout(timeout = 3 * 60 * 60 * 1000) {
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      if (warningTimer) clearTimeout(warningTimer);

      // 🔔 Alerte 1 min avant
      warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, timeout - 60 * 1000);

      // ⏰ Déconnexion
      timer = setTimeout(async () => {
        console.log("⏰ Session expirée, déconnexion...");
        await signOut(auth);
        router.push("/login");
      }, timeout);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      if (warningTimer) clearTimeout(warningTimer);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router, timeout]);

  // 👉 Fonction pour rester connecté
  const stayConnected = () => {
    setShowWarning(false);
  };

  return { showWarning, stayConnected };
}