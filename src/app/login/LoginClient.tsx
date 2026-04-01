"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
// import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ session supprimée quand navigateur fermé
      await setPersistence(auth, browserSessionPersistence);

      await signInWithEmailAndPassword(auth, email, password);

      // ✅ AJOUT (sécurité session)
      localStorage.setItem("loginTime", Date.now().toString());
      localStorage.setItem("lastActivity", Date.now().toString());

      router.push(redirect); // redirige vers la page demandée
    } catch {
      setError("Email ou mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen flex bg-blue-100">
      {/* Illustration */}
      <div className="hidden lg:flex w-1/2 justify-center items-center">
        <img
          src="/images/bappaya2-removebg-preview.png"
          alt="Papeterie illustration"
          width={700}
          height={700}
          className="drop-shadow-2xl"
        />
      </div>

      {/* Formulaire */}
      <div className="w-full lg:w-1/2 flex justify-center items-center px-6">
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full transform transition-all hover:scale-105">
          <h1 className="text-4xl font-extrabold text-black mb-2 flex items-center justify-center gap-3">
            <span className="text-5xl">🏪</span>BappayaPapeterie
          </h1>
          <p className="text-center text-gray-600 mb-10">
            Connectez-vous pour gérer votre stock et vos ventes
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="email"
              placeholder="✉️ Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md transition"
              required
            />
            <input
              type="password"
              placeholder="🔒 Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md transition"
              required
            />

            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}

            <button className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg hover:scale-105 transition-all duration-300">
              🔑 Se connecter
            </button>
          </form>

          {/* <p className="text-center text-gray-600 text-sm mt-6">
            Pas de compte ?{" "}
            <a href="#" className="text-blue-600 font-semibold hover:underline">
              Créer un compte
            </a>
          </p> */}
        </div>
      </div>
    </div>
  );
}
