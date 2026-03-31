"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ✅ AJOUT ICI
import { useAutoLogout } from "@/hooks/useAutoLogout";

interface Produit {
  id?: string;
  nom: string;
  prixAchat: number;
  quantiteDisponible: number;
}

export default function DashboardPage() {
  // ✅ MODIFICATION ICI (on récupère les valeurs)
  const { showWarning, stayConnected } = useAutoLogout(3 * 60 * 60 * 1000);

  const [totalProduits, setTotalProduits] = useState(0);
  const [valeurStock, setValeurStock] = useState(0);
  const [ventes, setVentes] = useState(0);
  const [users, setUsers] = useState(0);
  const [rupture, setRupture] = useState(0);
  const [faible, setFaible] = useState(0);

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      /** PRODUITS */
      const stockSnap = await getDocs(collection(db, "stock"));
      const produits = stockSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Produit[];

      setTotalProduits(produits.length);

      const valeur = produits.reduce(
        (acc, p) => acc + p.prixAchat * p.quantiteDisponible,
        0,
      );

      setValeurStock(valeur);

      const ruptureCount = produits.filter(
        (p) => p.quantiteDisponible === 0,
      ).length;
      const faibleCount = produits.filter(
        (p) => p.quantiteDisponible > 0 && p.quantiteDisponible <= 5,
      ).length;

      setRupture(ruptureCount);
      setFaible(faibleCount);

      /** VENTES */
      const ventesSnap = await getDocs(collection(db, "ventes"));
      setVentes(ventesSnap.size);

      /** UTILISATEURS */
      const userSnap = await getDocs(collection(db, "utilisateurs"));
      setUsers(userSnap.size);

      /** DATA GRAPHIQUE */
      setChartData([
        { name: "Produits", value: produits.length },
        { name: "Ventes", value: ventesSnap.size },
        { name: "Utilisateurs", value: userSnap.size },
        { name: "Rupture", value: ruptureCount },
        { name: "Stock faible", value: faibleCount },
      ]);
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      {/* 🔔 POPUP AJOUTÉE ICI */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2 text-red-600">
              ⚠️ Session bientôt expirée
            </h2>
            <p className="text-gray-600 mb-4">
              Vous allez être déconnecté dans 1 minute.
            </p>

            <button
              onClick={stayConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Rester connecté
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        📊 Tableau de Bord
      </h1>

      <div className="grid grid-cols-4 gap-6">
        {/* PRODUITS */}
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="flex justify-between items-center">
            <Package className="text-blue-600" size={28} />
            <span className="text-sm text-gray-500">Produits</span>
          </div>

          <p className="text-3xl font-bold mt-3">{totalProduits}</p>
        </div>

        {/* VALEUR STOCK */}
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="flex justify-between items-center">
            <TrendingUp className="text-green-600" size={28} />
            <span className="text-sm text-gray-500">Valeur Stock</span>
          </div>

          <p className="text-3xl font-bold mt-3">
            {valeurStock.toLocaleString()} GNF
          </p>
        </div>

        {/* VENTES */}
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="flex justify-between items-center">
            <ShoppingCart className="text-purple-600" size={28} />
            <span className="text-sm text-gray-500">Ventes</span>
          </div>

          <p className="text-3xl font-bold mt-3">{ventes}</p>
        </div>

        {/* UTILISATEURS */}
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="flex justify-between items-center">
            <Users className="text-orange-600" size={28} />
            <span className="text-sm text-gray-500">Utilisateurs</span>
          </div>

          <p className="text-3xl font-bold mt-3">{users}</p>
        </div>
      </div>

      {/* ALERTES */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-red-50 border border-red-200 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" />
            <p className="font-semibold text-red-600">Produits en rupture</p>
          </div>

          <p className="text-2xl font-bold mt-2">{rupture}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-600" />
            <p className="font-semibold text-yellow-600">Stock faible</p>
          </div>

          <p className="text-2xl font-bold mt-2">{faible}</p>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div className="bg-white p-6 mt-10 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Statistiques générales</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
