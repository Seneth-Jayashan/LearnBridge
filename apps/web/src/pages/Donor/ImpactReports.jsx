// src/pages/donor/ImpactReports.jsx
import { useEffect, useState } from "react";
import { getImpactReport } from "../../services/donorServices";
import { toast } from "react-toastify";

export default function ImpactReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getImpactReport();
      setReport(res.data);
    } catch (err) {
      toast.error("Failed to load impact report.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4CAF50]" />
      </div>
    );
  }

  if (!report) return null;

  const { totalItemsDonated, totalSchoolsSupported, mostDonatedItem, log } = report;

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <h1 className="text-2xl font-bold text-[#0A1D32] mb-1">Impact Reports</h1>
      <p className="text-slate-500 text-sm mb-6">See the difference your donations have made.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ImpactCard icon="📦" label="Total Items Donated" value={totalItemsDonated} gradient="from-[#207D86] to-[#4CAF50]" />
        <ImpactCard icon="🏫" label="Schools Supported" value={totalSchoolsSupported} gradient="from-blue-500 to-blue-600" />
        <ImpactCard icon="⭐" label="Most Donated Item" value={mostDonatedItem} gradient="from-purple-500 to-purple-600" isText />
      </div>

      {/* Transparency Log */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#0A1D32] mb-1">Transparency Log</h2>
        <p className="text-xs text-slate-400 mb-5">All your fulfilled donations are listed here.</p>

        {log.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No fulfilled donations yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {log.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-[#207D86]/5 transition-all duration-200 border border-transparent hover:border-[#207D86]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-linear-to-r from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A1D32]">
                      {entry.quantity} × {entry.item}
                    </p>
                    <p className="text-xs text-slate-400">donated to {entry.school}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {entry.date ? new Date(entry.date).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ImpactCard({ icon, label, value, gradient, isText }) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/70 font-medium">{label}</p>
          <p className={`font-bold mt-1 ${isText ? "text-lg leading-tight" : "text-3xl"}`}>
            {value}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
