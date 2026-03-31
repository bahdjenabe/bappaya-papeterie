/**
 * Carte de statistique
 */
export default function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "blue" | "green" | "orange";
}) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${colors[color]}`}>{value}</p>
    </div>
  );
}
