"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

// Types de filtre pour les rapports
type FilterType = "today" | "week" | "month" | "all";

export default function ReportsPage() {
  // États pour les statistiques globales
  const [revenuTotal, setRevenuTotal] = useState(0); // Total de toutes les ventes (montantTotal)
  const [totalEncaisse, setTotalEncaisse] = useState(0); // Argent réellement encaissé
  const [totalRestant, setTotalRestant] = useState(0); // Somme des soldes restants
  const [nombreVentes, setNombreVentes] = useState(0); // Nombre total de ventes
  const [chartData, setChartData] = useState<any[]>([]); // Données pour le graphique des ventes
  const [topProduits, setTopProduits] = useState<any[]>([]); // Top produits vendus
  const [filter, setFilter] = useState<FilterType>("all"); // Filtre sélectionné

  // Fonction pour vérifier si une date correspond au filtre actuel
  const isInFilter = (date: Date) => {
    const now = new Date();

    if (filter === "today") {
      return date.toDateString() === now.toDateString();
    }

    if (filter === "week") {
      const diff = now.getTime() - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
    }

    if (filter === "month") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    return true; // Si "all", tout est inclus
  };

  // Effet pour récupérer les données depuis Firebase
  useEffect(() => {
    const fetchReports = async () => {
      const ventesSnap = await getDocs(collection(db, "ventes"));

      // Variables pour calculs
      let total = 0;
      let encaisse = 0;
      let restant = 0;
      let ventesCount = 0;

      let ventesParJour: any = {}; // Pour le graphique des ventes par jour
      let produitsMap: any = {}; // Pour calculer les produits les plus vendus

      // Parcours des ventes
      ventesSnap.forEach((doc) => {
        const data = doc.data();

        if (!data.dateVente) return;

        const d = data.dateVente.toDate();

        // Vérifier si la vente correspond au filtre
        if (!isInFilter(d)) return;

        /** CALCULS GLOBAUX */
        total += data.montantTotal || 0; // Chiffre d'affaires
        encaisse += data.montantPaye || 0; // Argent encaissé
        restant += data.soldeRestant || 0; // Solde restant
        ventesCount++; // Nombre de ventes

        /** DONNÉES POUR LE GRAPHIQUE PAR JOUR */
        const jour = `${d.getDate()}/${d.getMonth() + 1}`;
        if (!ventesParJour[jour]) ventesParJour[jour] = 0;
        ventesParJour[jour] += data.montantTotal;

        /** TOP PRODUITS VENDUS */
        if (!produitsMap[data.nomProduit]) produitsMap[data.nomProduit] = 0;
        produitsMap[data.nomProduit] += data.quantiteVendue;
      });

      // Mise à jour des états
      setRevenuTotal(total);
      setTotalEncaisse(encaisse);
      setTotalRestant(restant);
      setNombreVentes(ventesCount);

      /** TRANSFORMATION DES DONNÉES POUR LE GRAPHIQUE */
      const chart = Object.keys(ventesParJour).map((key) => ({
        date: key,
        revenu: ventesParJour[key],
      }));
      setChartData(chart);

      /** CALCUL TOP PRODUITS */
      const top = Object.keys(produitsMap).map((key) => ({
        nom: key,
        quantite: produitsMap[key],
      }));
      top.sort((a, b) => b.quantite - a.quantite); // Tri décroissant
      setTopProduits(top.slice(0, 5)); // On garde les 5 premiers
    };

    fetchReports();
  }, [filter]);

  return (
    <div className="p-6 space-y-8">
      {/* TITRE */}
      <h1 className="text-3xl font-bold text-blue-600">
        📈 Rapports des ventes
      </h1>

      {/* FILTRES */}
      <div className="flex gap-3">
        {[
          { label: "Aujourd'hui", value: "today" },
          { label: "7 jours", value: "week" },
          { label: "Ce mois", value: "month" },
          { label: "Tout", value: "all" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as FilterType)}
            className={`px-4 py-2 rounded-lg ${
              filter === f.value ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* STATISTIQUES GLOBALES */}
      <div className="grid grid-cols-5 gap-6">
        {/* Chiffre d'affaires */}
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Chiffre d'affaires</p>
          <h2 className="text-2xl font-bold mt-2">
            {revenuTotal.toLocaleString()} GNF
          </h2>
        </div>

        {/* Argent encaissé */}
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Argent encaissé</p>
          <h2 className="text-2xl font-bold mt-2">
            {totalEncaisse.toLocaleString()} GNF
          </h2>
        </div>

        {/* Restant à payer */}
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Restant à payer</p>
          <h2 className="text-2xl font-bold mt-2">
            {totalRestant.toLocaleString()} GNF
          </h2>
        </div>

        {/* Nombre de ventes */}
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Nombre de ventes</p>
          <h2 className="text-2xl font-bold mt-2">{nombreVentes}</h2>
        </div>

        {/* Moyenne par vente */}
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Moyenne par vente</p>
          <h2 className="text-2xl font-bold mt-2">
            {nombreVentes > 0
              ? Math.round(revenuTotal / nombreVentes).toLocaleString()
              : 0}{" "}
            GNF
          </h2>
        </div>
      </div>

      {/* GRAPHIQUE D'ÉVOLUTION DES VENTES */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Evolution des ventes</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenu"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TOP PRODUITS VENDUS */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          🏆 Produits les plus vendus
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProduits}>
            <XAxis dataKey="nom" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantite" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
