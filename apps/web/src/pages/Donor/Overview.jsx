// src/pages/donor/Overview.jsx
import { useEffect, useState } from "react";
import { getMyDonations, getAllNeeds } from "../../services/donorServices";
import { toast } from "react-toastify";

export default function Overview() {
  const [donations, setDonations] = useState([]);
  const [urgentNeeds, setUrgentNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donRes, needRes] = await Promise.all([
        getMyDonations(),
        getAllNeeds({ urgency: "High", status: "Open" }),
      ]);
      setDonations(donRes.data);
      setUrgentNeeds(needRes.data.slice(0, 3));
    } catch (err) {
      toast.error("Failed to load overview.");
    } finally {
      setLoading(false);
    }
  };

  const total = donations.length;
  const pending = donations.filter((d) => d.status === "Pledged").length;
  const fulfilled = donations.filter((d) => d.status === "Fulfilled").length;
  const totalItems = donations.reduce((sum, d) => sum + d.quantity, 0);
  const schoolsSupported = [...new Set(donations.map((d) => d.schoolId?._id))].length;
  const recent = [...donations].slice(0, 5);

  const fulfillPercent = total > 0 ? Math.round((fulfilled / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4CAF50]" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <h1 className="text-2xl font-bold text-[#0A1D32] mb-1">Overview</h1>
      <p className="text-slate-500 text-sm mb-6">Your donation activity at a glance.</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🤝" label="Total Pledges" value={total} gradient="from-[#207D86] to-[#4CAF50]" />
        <StatCard icon="📦" label="Items Donated" value={totalItems} gradient="from-blue-500 to-blue-600" />
        <StatCard icon="⏳" label="Pending" value={pending} gradient="from-yellow-400 to-yellow-500" />
        <StatCard icon="🏫" label="Schools Supported" value={schoolsSupported} gradient="from-purple-500 to-purple-600" />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-[#0A1D32]">Fulfillment Progress</p>
          <span className="text-sm font-bold text-[#4CAF50]">{fulfillPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[#207D86] to-[#4CAF50] h-3 rounded-full transition-all duration-700"
            style={{ width: `${fulfillPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {fulfilled} of {total} donations fulfilled
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Donations */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-[#0A1D32] mb-4">Recent Donations</h2>
          {recent.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No donations yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map((d) => (
                <div key={d._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#0A1D32]">{d.itemName}</p>
                    <p className="text-xs text-slate-400">{d.schoolId?.name || "School"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    d.status === "Fulfilled"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Needs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-[#0A1D32] mb-4">🔴 Urgent Needs</h2>
          {urgentNeeds.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No urgent needs right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {urgentNeeds.map((n) => (
                <div key={n._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#0A1D32]">{n.itemName}</p>
                    <p className="text-xs text-slate-400">{n.schoolId?.name || "School"}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    High
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, gradient }) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/70 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}