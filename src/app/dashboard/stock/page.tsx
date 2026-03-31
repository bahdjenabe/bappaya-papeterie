"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Pencil, Plus, Trash2, X, ShoppingCart } from "lucide-react";

interface ProduitStock {
  id?: string;
  nom: string;
  categorie: string;
  fournisseur: string;
  prixAchat: number;
  prixVente: number;
  quantiteDisponible: number;
  dateAjout?: Timestamp;
}

export default function StockPage() {
  const [produits, setProduits] = useState<ProduitStock[]>([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<"Tous" | "Rupture" | "Faible" | "OK">(
    "Tous",
  );

  const [form, setForm] = useState<ProduitStock>({
    nom: "",
    categorie: "",
    fournisseur: "",
    prixAchat: 0,
    prixVente: 0,
    quantiteDisponible: 0,
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [reapproQty, setReapproQty] = useState<number>(0);
  const [modalType, setModalType] = useState<"delete" | "reappro" | null>(null);
  // 📄 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const stockRef = collection(db, "stock");

  /** 🔄 Charger les produits depuis Firestore */
  const fetchProduits = async () => {
    const snapshot = await getDocs(stockRef);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProduitStock[];
    setProduits(data);
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  /** ➕ Ajouter ou ✏️ Modifier un produit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      const { quantiteDisponible, ...rest } = form;
      await updateDoc(doc(db, "stock", editId), {
        ...rest, // met à jour tout sauf la quantité
        quantiteDisponible: increment(
          quantiteDisponible -
            produits.find((p) => p.id === editId)?.quantiteDisponible!,
        ),
      });
      setMessage(`Produit "${form.nom}" modifié avec succès ✅`);
    } else {
      await addDoc(stockRef, { ...form, dateAjout: Timestamp.now() });
      setMessage(`Produit "${form.nom}" ajouté avec succès ✅`);
    }

    resetForm();
    fetchProduits();
    setIsFormModalOpen(false);
    setTimeout(() => setMessage(""), 3000);
  };

  /** 🗑 Ouvrir modal suppression */
  const openDeleteModal = (produit: ProduitStock) => {
    setSelectedId(produit.id!);
    setSelectedName(produit.nom);
    setModalType("delete");
    setIsModalOpen(true);
    setReapproQty(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
    setSelectedName("");
    setReapproQty(0);
    setModalType(null);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    await deleteDoc(doc(db, "stock", selectedId));
    setMessage(`Produit "${selectedName}" supprimé avec succès 🗑`);
    fetchProduits();
    closeModal();
    setTimeout(() => setMessage(""), 3000);
  };

  const confirmReappro = async () => {
    if (!selectedId || reapproQty <= 0) return;
    const produit = produits.find((p) => p.id === selectedId);
    if (!produit) return;
    await updateDoc(doc(db, "stock", selectedId), {
      quantiteDisponible: increment(reapproQty),
    });
    setMessage(`Produit "${selectedName}" réapprovisionné avec succès ✅`);
    fetchProduits();
    closeModal();
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEdit = (produit: ProduitStock) => {
    setForm(produit);
    setEditId(produit.id!);
    setIsFormModalOpen(true);
  };

  const resetForm = () => {
    setForm({
      nom: "",
      categorie: "",
      fournisseur: "",
      prixAchat: 0,
      prixVente: 0,
      quantiteDisponible: 0,
    });
    setEditId(null);
  };

  /** Filtrer et rechercher */
  const filteredProduits = produits.filter((p) => {
    const matchSearch =
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.categorie.toLowerCase().includes(search.toLowerCase()) ||
      p.fournisseur.toLowerCase().includes(search.toLowerCase());

    let matchFilter = true;
    if (filter === "Rupture") matchFilter = p.quantiteDisponible === 0;
    if (filter === "Faible")
      matchFilter = p.quantiteDisponible > 0 && p.quantiteDisponible <= 5;
    if (filter === "OK") matchFilter = p.quantiteDisponible > 5;

    return matchSearch && matchFilter;
  });

  // 📄 Calcul pagination
  const totalPages = Math.ceil(filteredProduits.length / itemsPerPage);

  const paginatedProduits = filteredProduits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  /** Calcul valeur totale du stock */
  const valeurTotale = produits.reduce(
    (acc, p) => acc + p.prixAchat * p.quantiteDisponible,
    0,
  );

  return (
    <div className="p-6 relative">
      {/* TITRE */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">
          📦 Gestion du Stock
        </h1>
        <button
          onClick={() => {
            resetForm(); // Important pour s'assurer que le formulaire est vide avant ajout
            setIsFormModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Ajouter produit
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {/* DASHBOARD */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-sm text-gray-500">Total Produits</p>
          <p className="text-xl font-bold">{produits.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-sm text-gray-500">Valeur Totale Stock</p>
          <p className="text-xl font-bold">{valeurTotale} GNF</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-sm text-gray-500">Produits Rupture</p>
          <p className="text-xl font-bold">
            {produits.filter((p) => p.quantiteDisponible === 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <p className="text-sm text-gray-500">Stock Faible</p>
          <p className="text-xl font-bold">
            {
              produits.filter(
                (p) => p.quantiteDisponible > 0 && p.quantiteDisponible <= 5,
              ).length
            }
          </p>
        </div>
      </div>

      {/* RECHERCHE & FILTRE */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-400"
        />
        {(["Tous", "Rupture", "Faible", "OK"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-blue-600">
              <th className="py-3">Nom</th>
              <th>Catégorie</th>
              <th>Fournisseur</th>
              <th>Prix Achat</th>
              <th>Prix Vente</th>
              <th>Quantité</th>
              <th>Date Ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProduits.map((produit) => (
              <tr
                key={produit.id}
                className={`border-b hover:bg-blue-50 transition-all ${
                  produit.quantiteDisponible <= 5 &&
                  produit.quantiteDisponible > 0
                    ? "animate-pulse"
                    : ""
                }`}
              >
                <td className="py-3 font-medium">{produit.nom}</td>
                <td>{produit.categorie}</td>
                <td>{produit.fournisseur}</td>
                <td>{produit.prixAchat} GNF</td>
                <td>{produit.prixVente} GNF</td>
                <td>
                  {produit.quantiteDisponible === 0 ? (
                    <span className="bg-red-700 text-white px-2 py-1 rounded-lg text-sm">
                      Rupture de stock
                    </span>
                  ) : produit.quantiteDisponible <= 5 ? (
                    <span className="bg-red-400 text-white px-2 py-1 rounded-lg text-sm">
                      Stock faible ({produit.quantiteDisponible})
                    </span>
                  ) : (
                    <span className="bg-green-400 text-white px-2 py-1 rounded-lg text-sm">
                      Stock OK ({produit.quantiteDisponible})
                    </span>
                  )}
                </td>
                <td>
                  {produit.dateAjout
                    ? produit.dateAjout.toDate().toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "UTC",
                      })
                    : "-"}
                </td>
                <td className="flex gap-4 py-3">
                  {/* Modifier */}
                  <button
                    onClick={() => handleEdit(produit)}
                    className="text-blue-500 hover:scale-110 transition"
                  >
                    <Pencil size={18} />
                  </button>

                  {/* Réapprovisionnement */}
                  <button
                    onClick={() => {
                      setSelectedId(produit.id!);
                      setSelectedName(produit.nom);
                      setReapproQty(0);
                      setModalType("reappro");
                      setIsModalOpen(true);
                    }}
                    className="text-green-500 hover:scale-110 transition"
                  >
                    <ShoppingCart size={18} />
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={() => openDeleteModal(produit)}
                    className="text-red-500 hover:scale-110 transition"
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            ← Précédent
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* MODAL FORMULAIRE */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[600px] shadow-xl">
            <h2 className="text-xl font-bold text-blue-600 mb-4">
              {editId ? "Modifier Produit" : "Ajouter Produit"}
            </h2>
            <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nom du produit", key: "nom", type: "text" },
                  { label: "Catégorie", key: "categorie", type: "text" },
                  { label: "Fournisseur", key: "fournisseur", type: "text" },
                  {
                    label: "Prix d'achat (GNF)",
                    key: "prixAchat",
                    type: "number",
                  },
                  {
                    label: "Prix de vente (GNF)",
                    key: "prixVente",
                    type: "number",
                  },
                  {
                    label: "Quantité disponible",
                    key: "quantiteDisponible",
                    type: "number",
                  },
                ].map((field) => (
                  <div key={field.key} className="flex flex-col">
                    <label className="mb-1 font-semibold text-slate-700">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onFocus={(e) => {
                        if (
                          field.type === "number" &&
                          (form as any)[field.key] === 0
                        ) {
                          setForm({ ...form, [field.key]: "" });
                        }
                      }}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [field.key]:
                            field.type === "number"
                              ? e.target.value === ""
                                ? 0
                                : Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                      required
                    />
                  </div>
                ))}
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-slate-700">
                    Date d'ajout
                  </label>
                  <input
                    type="text"
                    value={
                      editId
                        ? form.dateAjout?.toDate().toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                            timeZone: "UTC",
                          })
                        : new Date().toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                            timeZone: "UTC",
                          })
                    }
                    readOnly
                    className="border p-2 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex items-center gap-2 bg-gray-400 text-white px-6 py-2 rounded-xl hover:bg-gray-500 transition"
                >
                  <X size={18} /> Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
                >
                  <Plus size={18} />
                  {editId ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION / REAPPRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl">
            {modalType === "delete" ? (
              <>
                <h2 className="text-xl font-bold text-red-600 mb-4">
                  Confirmer la suppression
                </h2>
                <p className="text-slate-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold text-red-600">
                    {selectedName}
                  </span>{" "}
                  ?
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-blue-600 mb-4">
                  Réapprovisionnement
                </h2>
                <p className="text-slate-600 mb-2">
                  Produit: <span className="font-semibold">{selectedName}</span>
                </p>
                <input
                  type="number"
                  min={1}
                  value={reapproQty}
                  onChange={(e) => setReapproQty(Number(e.target.value))}
                  className="border p-2 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Quantité à ajouter"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmReappro}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Ajouter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
