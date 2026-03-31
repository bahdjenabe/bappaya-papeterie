"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

// 🔹 Import pour Firebase Auth
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

// 🔹 Interface utilisateur
interface Utilisateur {
  id?: string;
  uid: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  dateCreation?: Timestamp;
}

// 🔹 Interface données utilisateur pour le hook
interface UserData {
  uid: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
}

// 🔹 Hook personnalisé pour gérer l'auth et récupérer les données Firestore
// export function useRequireAuth() {
//   const [user, setUser] = useState<User | null>(null);
//   const [userData, setUserData] = useState<UserData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (!currentUser) {
//         router.replace("/login");
//         return;
//       }

//       setUser(currentUser);

//       // 🔎 Cherche l'utilisateur dans Firestore
//       const q = query(
//         collection(db, "utilisateurs"),
//         where("uid", "==", currentUser.uid),
//       );
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         const docData = querySnapshot.docs[0].data();
//         setUserData(docData as UserData);
//       } else {
//         // ⚠ Création automatique si introuvable ou uid vide
//         const newUserData: UserData = {
//           uid: currentUser.uid,
//           nom: currentUser.email?.split("@")[0] || "Utilisateur",
//           email: currentUser.email!,
//           role: "employe",
//           actif: true,
//         };

//         await setDoc(doc(db, "utilisateurs", currentUser.uid), newUserData);
//         setUserData(newUserData);
//       }

//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [router]);

//   return { user, userData, loading };
// }

// 🔹 Page gestion utilisateurs
export default function UtilisateursPage() {
  const { user, userData, loading } = useRequireAuth();
  const router = useRouter();

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<
    Partial<Utilisateur & { password?: string }>
  >({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);

  const filteredUsers = utilisateurs.filter(
    (user) =>
      user.nom.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 🔐 Vérification rôle admin
  useEffect(() => {
    if (!loading && userData && userData.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [userData, loading, router]);

  // 🔄 Charger tous les utilisateurs
  const fetchUtilisateurs = async () => {
    const querySnapshot = await getDocs(collection(db, "utilisateurs"));
    const data: Utilisateur[] = [];

    querySnapshot.forEach((docSnap) => {
      const docData = docSnap.data() as Utilisateur;
      // 🔹 Ignore si uid vide
      if (!docData.uid) return;
      data.push({
        id: docSnap.id,
        ...docData,
      });
    });

    setUtilisateurs(data);
    setLoadingData(false);
  };

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchUtilisateurs();
    }
  }, [userData]);

  // 🔴 Modal suppression
  const openDeleteModal = (user: Utilisateur) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser?.id) return;

    await deleteDoc(doc(db, "utilisateurs", selectedUser.id));

    setDeleteModalOpen(false);
    setSelectedUser(null);
    fetchUtilisateurs();
  };

  // ✏️ Modifier utilisateur
  const modifierUtilisateur = (user: Utilisateur) => {
    setFormData(user);
    setModalOpen(true);
  };

  // ➕ Ajouter utilisateur
  const ajouterUtilisateur = () => {
    if (userData?.role !== "admin") return;
    setFormData({ role: "employe", actif: true });
    setModalOpen(true);
  };

  // 💾 Enregistrer formulaire
  const saveForm = async () => {
    if (
      !formData.nom ||
      !formData.email ||
      !formData.role ||
      (!formData.id && !formData.password)
    ) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    const auth = getAuth();

    if (formData.id) {
      await updateDoc(doc(db, "utilisateurs", formData.id), {
        nom: formData.nom,
        email: formData.email,
        role: formData.role,
        actif: formData.actif,
      });
    } else {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email!,
        formData.password!,
      );

      const newUser = userCredential.user;

      await addDoc(collection(db, "utilisateurs"), {
        uid: newUser.uid,
        nom: formData.nom,
        email: formData.email,
        role: formData.role,
        actif: formData.actif,
        dateCreation: Timestamp.now(),
      });
    }

    setModalOpen(false);
    fetchUtilisateurs();
    setFormData({});
  };

  // 🔹 Protection rendu
  if (loading || !userData) return <p>Chargement...</p>;
  if (userData.role !== "admin") {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div>
      {/* 🔵 HEADER PAGE */}
      <div className="flex items-center justify-between mb-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Gestion des utilisateurs
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gérez les comptes, rôles et statuts des utilisateurs
          </p>
        </div>

        {userData?.role === "admin" && (
          <button
            onClick={ajouterUtilisateur}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            Ajouter un utilisateur
          </button>
        )}
      </div>

      {/* 📊 Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Total utilisateurs</p>
          <h3 className="text-2xl font-bold">{utilisateurs.length}</h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Admins</p>
          <h3 className="text-2xl font-bold">
            {utilisateurs.filter((u) => u.role === "admin").length}
          </h3>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500">Utilisateurs actifs</p>
          <h3 className="text-2xl font-bold">
            {utilisateurs.filter((u) => u.actif).length}
          </h3>
        </div>
      </div>

      {/* 🔎 Recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 w-72 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 text-left">Nom</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Rôle</th>
              <th className="p-4 text-left">Statut</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 font-medium text-slate-800">{user.nom}</td>
                <td className="p-4 text-slate-600">{user.email}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.actif
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {user.actif ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-4">
                  <button
                    onClick={() => modifierUtilisateur(user)}
                    className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => openDeleteModal(user)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ← Précédent
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Suivant →
        </button>
      </div>

      {/* MODAL FORMULAIRE */}
      {modalOpen && userData?.role === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[420px] relative shadow-xl border border-slate-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4">
              {formData.id ? "Modifier utilisateur" : "Ajouter utilisateur"}
            </h2>

            <div className="flex flex-col gap-3">
              {/* Nom */}
              <div className="flex flex-col">
                <label htmlFor="nom" className="mb-1 font-medium">
                  Nom
                </label>
                <input
                  id="nom"
                  type="text"
                  placeholder="Nom complet"
                  value={formData.nom || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="border p-2 rounded"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label htmlFor="email" className="mb-1 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border p-2 rounded"
                />
              </div>

              {/* Password */}
              {!formData.id && (
                <div className="flex flex-col">
                  <label htmlFor="password" className="mb-1 font-medium">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="border p-2 rounded"
                  />
                </div>
              )}

              {/* Rôle */}
              <div className="flex flex-col">
                <label htmlFor="role" className="mb-1 font-medium">
                  Rôle
                </label>
                <select
                  id="role"
                  value={formData.role || "employe"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="border p-2 rounded"
                >
                  <option value="admin">Admin</option>
                  <option value="employe">Employé</option>
                </select>
              </div>

              {/* Statut */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="actif"
                  type="checkbox"
                  checked={formData.actif ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, actif: e.target.checked })
                  }
                />
                <label htmlFor="actif" className="font-medium">
                  Utilisateur actif
                </label>
              </div>

              {/* Bouton */}
              <button
                onClick={saveForm}
                className="mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {formData.id
                  ? "Enregistrer les modifications"
                  : "Créer utilisateur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[360px] shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold mb-2 text-slate-800">
              Supprimer l'utilisateur
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Voulez-vous vraiment supprimer <b>{selectedUser.nom}</b> ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
