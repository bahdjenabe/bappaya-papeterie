"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  BarChart3,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProduitStock {
  nom: string;
  categorie: string;
  fournisseur: string;
  prixVente: number;
  prixAchat?: number;
  quantiteDisponible: number;
  firestoreId: string;
}

interface Vente {
  id?: string;
  produitId: string;
  nomProduit: string;
  quantiteVendue: number;
  prixUnitaire: number;
  montantTotal: number;
  montantPaye: number; // ajouté
  soldeRestant: number; // ajouté
  dateVente: Timestamp;
}

export default function SalesPage() {
  const [produits, setProduits] = useState<ProduitStock[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [montantPaye, setMontantPaye] = useState(0); // ajouté
  const [editingVente, setEditingVente] = useState<Vente | null>(null);
  const [message, setMessage] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venteToDelete, setVenteToDelete] = useState<Vente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const stockRef = collection(db, "stock");
  const ventesRef = collection(db, "ventes");

  // ================= MESSAGE TEMPORAIRE =================
  const showTemporaryMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  // ================= FETCH =================
  const fetchProduits = async () => {
    const snapshot = await getDocs(stockRef);
    const data = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<ProduitStock, "firestoreId">),
      firestoreId: docSnap.id,
    }));
    setProduits(data);
  };

  const fetchVentes = async () => {
    const snapshot = await getDocs(ventesRef);
    const data = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Vente),
    }));
    setVentes(data);
  };

  useEffect(() => {
    fetchProduits();
    fetchVentes();
  }, []);

  // ================= FILTRE =================
  const ventesFiltrees = useMemo(() => {
    if (!dateFilter) return ventes;
    return ventes.filter((v) => {
      const d = v.dateVente.toDate().toISOString().split("T")[0];
      return d === dateFilter;
    });
  }, [ventes, dateFilter]);

  // ================= PAGINATION =================
  const totalPages = Math.ceil(ventesFiltrees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const ventesPaginees = ventesFiltrees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ================= STATS =================
  const totalGeneral = ventesFiltrees.reduce(
    (acc, v) => acc + v.montantTotal,
    0,
  );
  const totalArticles = ventesFiltrees.reduce(
    (acc, v) => acc + v.quantiteVendue,
    0,
  );
  const beneficeTotal = ventesFiltrees.reduce((acc, v) => {
    const produit = produits.find((p) => p.firestoreId === v.produitId);

    if (!produit || !produit.prixAchat || produit.prixAchat <= 0) {
      return acc;
    }

    const benefice = (v.prixUnitaire - produit.prixAchat) * v.quantiteVendue;

    return acc + benefice;
  }, 0);

  // ================= FACTURE PDF =================
  const generateInvoice = (vente: Vente) => {
    const docPdf = new jsPDF();
    const numeroFacture = "FAC-" + vente.id?.slice(0, 6).toUpperCase();

    docPdf.setFillColor(63, 132, 246);
    docPdf.rect(0, 0, 210, 35, "F");
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(18);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("BAPPAYA PAPETERIE", 14, 20);

    docPdf.setFontSize(11);
    docPdf.setFont("helvetica", "normal");
    docPdf.text("Adresse : Conakry, Guinée", 14, 26);
    docPdf.text("Téléphone : +224 620 52 21 63", 14, 31);

    docPdf.setTextColor(0, 0, 0);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Facture N°: ${numeroFacture}`, 150, 20);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(
      `Date: ${vente.dateVente.toDate().toLocaleString("fr-FR")}`,
      150,
      26,
    );

    autoTable(docPdf, {
      startY: 40,
      head: [["Produit", "Quantité", "Prix Unitaire", "Total"]],
      body: [
        [
          vente.nomProduit,
          vente.quantiteVendue,
          `${vente.prixUnitaire} GNF`,
          `${vente.montantTotal} GNF`,
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [63, 132, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      bodyStyles: { fillColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
    });

    const finalY = (docPdf as any).lastAutoTable.finalY;

    docPdf.setFontSize(12);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Montant payé : ${vente.montantPaye} GNF`, 14, finalY + 10);
    docPdf.text(`Solde restant : ${vente.soldeRestant} GNF`, 14, finalY + 18);
    docPdf.text(`Total à payer : ${vente.montantTotal} GNF`, 14, finalY + 28);

    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "normal");
    docPdf.text("Merci pour votre achat !", 14, finalY + 38);

    docPdf.save(`Facture_${numeroFacture}.pdf`);
  };

  // ================= AJOUT / MODIFICATION =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const produit = produits.find((p) => p.firestoreId === selectedProduitId);

    if (!produit) return;

    // ⚠️ Empêcher vente à perte
    if (produit.prixVente < (produit.prixAchat || 0)) {
    }

    const soldeRestant = quantite * produit.prixVente - montantPaye;

    if (editingVente) {
      const ancienProduit = produits.find(
        (p) => p.firestoreId === editingVente.produitId,
      );

      if (ancienProduit) {
        await updateDoc(doc(db, "stock", ancienProduit.firestoreId), {
          quantiteDisponible:
            ancienProduit.quantiteDisponible + editingVente.quantiteVendue,
        });
      }

      if (quantite > produit.quantiteDisponible)
        return showTemporaryMessage("Stock insuffisant");

      await updateDoc(doc(db, "stock", produit.firestoreId), {
        quantiteDisponible: produit.quantiteDisponible - quantite,
      });

      await updateDoc(doc(db, "ventes", editingVente.id!), {
        produitId: produit.firestoreId,
        nomProduit: produit.nom,
        quantiteVendue: quantite,
        prixUnitaire: produit.prixVente,
        montantTotal: quantite * produit.prixVente,
        montantPaye,
        soldeRestant,
      });

      setEditingVente(null);
      showTemporaryMessage("Vente modifiée ✅");
    } else {
      if (quantite > produit.quantiteDisponible)
        return showTemporaryMessage("Stock insuffisant");

      await addDoc(ventesRef, {
        produitId: produit.firestoreId,
        nomProduit: produit.nom,
        quantiteVendue: quantite,
        prixUnitaire: produit.prixVente,
        montantTotal: quantite * produit.prixVente,
        montantPaye,
        soldeRestant,
        dateVente: Timestamp.now(),
      });

      await updateDoc(doc(db, "stock", produit.firestoreId), {
        quantiteDisponible: produit.quantiteDisponible - quantite,
      });

      showTemporaryMessage("Vente ajoutée ✅");
    }

    setSelectedProduitId("");
    setQuantite(1);
    setMontantPaye(0); // réinitialisation
    fetchProduits();
    fetchVentes();
  };

  // ================= SUPPRESSION =================
  const handleDeleteClick = (vente: Vente) => {
    setVenteToDelete(vente);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!venteToDelete) return;

    const produit = produits.find(
      (p) => p.firestoreId === venteToDelete.produitId,
    );

    if (produit) {
      await updateDoc(doc(db, "stock", produit.firestoreId), {
        quantiteDisponible:
          produit.quantiteDisponible + venteToDelete.quantiteVendue,
      });
    }

    await deleteDoc(doc(db, "ventes", venteToDelete.id!));
    showTemporaryMessage("Vente supprimée ✅");
    fetchProduits();
    fetchVentes();

    setIsModalOpen(false);
    setVenteToDelete(null);
  };

  // ================= RENDER =================
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blue-600">
        💰 Gestion des Ventes
      </h1>

      {message && (
        <div className="p-3 bg-green-100 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow flex gap-3 items-center">
          <DollarSign />
          <div>
            <p className="text-sm text-gray-500">Total Général</p>
            <p className="font-bold">{totalGeneral} GNF</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex gap-3 items-center">
          <BarChart3 />
          <div>
            <p className="text-sm text-gray-500">Articles Vendus</p>
            <p className="font-bold">{totalArticles}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow flex gap-3 items-center">
          <DollarSign />
          <div>
            <p className="text-sm text-gray-500">Bénéfice</p>
            <p
              className={`font-bold ${
                beneficeTotal < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {beneficeTotal} GNF
            </p>
          </div>
        </div>
      </div>

      {/* FILTRE */}
      <div className="flex items-center gap-3">
        <Calendar />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* FORMULAIRE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingVente ? "✏️ Modifier" : "➕ Ajouter"} une vente
        </h2>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-4">
          {/* Sélection du produit */}
          <div className="flex flex-col">
            <label htmlFor="produit" className="mb-1 font-medium">
              Produit
            </label>
            <select
              id="produit"
              value={selectedProduitId}
              onChange={(e) => setSelectedProduitId(e.target.value)}
              className="border p-3 rounded-lg"
              required
            >
              <option value="">Sélectionner un produit</option>
              {produits.map((p) => (
                <option key={p.firestoreId} value={p.firestoreId}>
                  {p.nom} ({p.quantiteDisponible} en stock)
                </option>
              ))}
            </select>
          </div>

          {/* Prix unitaire */}
          <div className="flex flex-col">
            <label htmlFor="prixUnitaire" className="mb-1 font-medium">
              Prix unitaire (GNF)
            </label>
            <input
              id="prixUnitaire"
              type="number"
              value={
                produits.find((p) => p.firestoreId === selectedProduitId)
                  ?.prixVente || 0
              }
              readOnly
              className="border p-3 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Quantité */}
          <div className="flex flex-col">
            <label htmlFor="quantite" className="mb-1 font-medium">
              Quantité
            </label>
            <input
              id="quantite"
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Number(e.target.value))}
              className="border p-3 rounded-lg"
              required
            />
          </div>

          {/* Total calculé automatiquement */}
          <div className="flex flex-col">
            <label htmlFor="total" className="mb-1 font-medium">
              Total (GNF)
            </label>
            <input
              id="total"
              type="number"
              value={
                quantite *
                (produits.find((p) => p.firestoreId === selectedProduitId)
                  ?.prixVente || 0)
              }
              readOnly
              className="border p-3 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Montant payé */}
          <div className="flex flex-col">
            <label htmlFor="montantPaye" className="mb-1 font-medium">
              Montant payé
            </label>
            <input
              id="montantPaye"
              type="number"
              min={0}
              max={
                quantite *
                (produits.find((p) => p.firestoreId === selectedProduitId)
                  ?.prixVente || 0)
              }
              value={montantPaye}
              onChange={(e) => setMontantPaye(Number(e.target.value))}
              placeholder="Montant payé"
              className="border p-3 rounded-lg"
              required
            />
          </div>

          {/* Bouton */}
          <div className="flex flex-col justify-end">
            <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
              {editingVente ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>

      {/* TABLEAU */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-3">Produit</th>
              <th className="p-3">Quantité</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payé</th> {/* ajouté */}
              <th className="p-3">Solde</th> {/* ajouté */}
              <th className="p-3">Date</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ventesPaginees.map((v) => {
              return (
                <tr key={v.id} className="border-b hover:bg-blue-50">
                  <td className="p-3">{v.nomProduit}</td>
                  <td className="p-3">{v.quantiteVendue}</td>
                  <td className="p-3">{v.prixUnitaire} GNF</td>
                  <td className="p-3 font-semibold">{v.montantTotal} GNF</td>
                  <td className="p-3 font-semibold">{v.montantPaye} GNF</td>
                  <td className="p-3 font-semibold">{v.soldeRestant} GNF</td>
                  <td className="p-3">
                    {v.dateVente.toDate().toLocaleString("fr-FR")}
                  </td>
                  <td className="p-3 flex justify-center gap-3">
                    <button
                      onClick={() => generateInvoice(v)}
                      className="text-green-600"
                    >
                      <FileText size={18} />
                    </button>

                    <button
                      onClick={() => {
                        setEditingVente(v);
                        setSelectedProduitId(v.produitId);
                        setQuantite(v.quantiteVendue);
                        setMontantPaye(v.montantPaye);
                      }}
                      className="text-blue-500"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(v)}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Supprimer la vente</h2>
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer la vente de{" "}
              <span className="font-semibold">{venteToDelete?.nomProduit}</span>{" "}
              ?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
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
