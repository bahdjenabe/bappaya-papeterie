"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";

// 🔹 Interface pour typer les données utilisateur
interface UserData {
  uid: string; // UID officiel Firebase Auth
  nom: string; // Nom de l'utilisateur
  email: string; // Email de l'utilisateur
  role: string; // Rôle : "admin" ou "employe"
  actif: boolean; // Statut actif/inactif
}

// 🔹 Hook personnalisé pour gérer l'authentification et récupérer les données Firestore
export function useRequireAuth() {
  const [user, setUser] = useState<User | null>(null); // Stocke l'utilisateur Firebase Auth
  const [userData, setUserData] = useState<UserData | null>(null); // Stocke les données Firestore
  const [loading, setLoading] = useState(true); // Indique si on est en train de charger
  const router = useRouter();

  useEffect(() => {
    // 🔹 Écoute les changements d'authentification
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // ❌ Si personne n'est connecté → redirection vers login
        router.replace("/login");
        return;
      }

      // ✅ On a un utilisateur connecté
      setUser(currentUser);
      console.log("UID connecté :", currentUser.uid);

      // 🔎 On cherche dans Firestore le document correspondant au uid de l'utilisateur
      const q = query(
        collection(db, "utilisateurs"),
        where("uid", "==", currentUser.uid),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // ✅ Document trouvé → on récupère ses données
        const docData = querySnapshot.docs[0].data();
        setUserData(docData as UserData);
      } else {
        // ⚠ Document introuvable → on le crée automatiquement
        console.warn(
          "Utilisateur introuvable dans Firestore, création automatique...",
        );

        const newUserData: UserData = {
          uid: currentUser.uid, // UID officiel
          nom: currentUser.email?.split("@")[0] || "Utilisateur", // Nom par défaut
          email: currentUser.email!, // Email
          role: "employe", // Rôle par défaut
          actif: true, // Statut actif
        };

        // 🔹 Création automatique du document Firestore avec le bon UID
        await setDoc(doc(db, "utilisateurs", currentUser.uid), newUserData);

        // 🔹 On met à jour l'état avec ces données
        setUserData(newUserData);
      }

      // 🔹 Chargement terminé
      setLoading(false);
    });

    // 🔹 Nettoyage de l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, [router]);

  // 🔹 On retourne les états pour que les composants puissent les utiliser
  return { user, userData, loading };
}
