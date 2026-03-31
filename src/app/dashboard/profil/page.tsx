"use client";

import { useEffect, useState } from "react";
import { Mail, KeyRound, Save, User } from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut, // ✅ AJOUT
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ AJOUT
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
  }, []);

  if (!user) {
    return <p className="p-6">Chargement...</p>;
  }

  // ✅ AJOUT
  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return "Faible";
    if (password.length < 10) return "Moyen";
    return "Fort";
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      // 🔐 Re-authentification
      const credential = EmailAuthProvider.credential(user.email, oldPassword);

      await reauthenticateWithCredential(user, credential);

      // 🔄 Mise à jour
      await updatePassword(user, newPassword);

      setSuccess("Mot de passe modifié avec succès ✅");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // ✅ AJOUT : déconnexion + redirection
      setTimeout(async () => {
        await signOut(auth);
        window.location.href = "/login";
      }, 1500);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setError("Ancien mot de passe incorrect");
      } else if (error.code === "auth/requires-recent-login") {
        setError("Reconnectez-vous pour continuer");
      } else {
        setError("Une erreur est survenue");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center ">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-2">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <User size={40} />
          </div>

          <h2 className="mt-1 text-lg font-semibold text-gray-800">
            {user.displayName || "Utilisateur"}
          </h2>

          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Mail size={14} />
            {user.email}
          </p>
        </div>

        {/* Messages */}
        <div className="px-3 mt-2">
          {error && (
            <p className="text-red-500 text-xs bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-600 text-xs bg-green-50 p-2 rounded">
              {success}
            </p>
          )}
        </div>

        {/* Formulaire */}
        <div className="mt-1 space-y-4 border-t pt-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <KeyRound size={16} />
            Modifier le mot de passe
          </h3>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-500">Adresse email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-100"
            />
          </div>

          {/* Ancien mot de passe */}
          <div>
            <label className="text-xs text-gray-500">Ancien mot de passe</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="text-xs text-gray-500">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />

            {/* Force */}
            <p className="text-xs text-gray-500 mt-1">
              Force :{" "}
              <span
                className={
                  newPassword.length < 6
                    ? "text-red-500"
                    : newPassword.length < 10
                      ? "text-yellow-500"
                      : "text-green-500"
                }
              >
                {getPasswordStrength(newPassword)}
              </span>
            </p>
          </div>

          {/* Confirmation */}
          <div>
            <label className="text-xs text-gray-500">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleChangePassword}
            className="w-full flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
          >
            <Save size={16} />
            Modifier le mot de passe
          </button>
        </div>
      </div>
    </div>
  );
}
