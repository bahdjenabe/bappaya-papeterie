"use client";

import { useState } from "react";

/**
 * Type produit
 */
export interface ProductFormData {
  name: string;
  category: string;
  price: number;
  stock: number;
}

/**
 * Formulaire produit (ajout / modification)
 */
export default function ProductForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: ProductFormData) => void;
  initialData?: ProductFormData;
}) {
  const [form, setForm] = useState<ProductFormData>(
    initialData || {
      name: "",
      category: "",
      price: 0,
      stock: 0,
    },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <input
        className="input"
        placeholder="Nom du produit"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <input
        className="input"
        placeholder="Catégorie"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        required
      />

      <input
        type="number"
        className="input"
        placeholder="Prix"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        required
      />

      <input
        type="number"
        className="input"
        placeholder="Stock"
        value={form.stock}
        onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
        required
      />

      <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
        Enregistrer
      </button>
    </form>
  );
}
