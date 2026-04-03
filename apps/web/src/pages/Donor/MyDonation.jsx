// src/pages/donor/MyDonations.jsx
import { useEffect, useState } from "react";
import { getMyDonations, markFulfilled } from "../../services/DonorServices";
import { toast } from "react-toastify";

const tabs = ["All", "Pending", "Completed"];

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [fulfilling, setFulfilling] = useState(null);

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const res = await getMyDonations();
      setDonations(res.data);
    } catch (err) {
      toast.error("Failed to load your donations.");
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (id) => {
    try {
      setFulfilling(id);
      await markFulfilled(id);
      toast.success("Marked as fulfilled! 🎉");
      fetchMyDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update.");
    } finally {
      setFulfilling(null);
    }
  };

  const filtered = donations.filter((d) => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending") return d.status === "Pledged";
    if (activeTab === "Completed") return d.status === "Fulfilled";
    return true;
  });

  // Summary counts
  const total = donations.length;
  const pending = donations.filter((d) => d.status === "Pledged").length;
  const completed = donations.filter((d) => d.status === "Fulfilled").length;

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
      <h1 className="text-2xl font-bold text-[#0A1D32] mb-1">My Donations</h1>
      <p className="text-slate-500 text-sm mb-6">Track all your pledged and fulfilled donations.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Pledges" value={total} color="from-[#207D86] to-[#4CAF50]" icon="🤝" />
        <StatCard label="Pending" value={pending} color="from-yellow-400 to-yellow-500" icon="⏳" />
        <StatCard label="Completed" value={completed} color="from-green-400 to-green-600" icon="✅" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? "bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white shadow-md"
                : "text-slate-500 hover:text-[#207D86]"
            }`}
          >
            {tab}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {tab === "All" ? total : tab === "Pending" ? pending : completed}
            </span>
          </button>
        ))}
      </div>

      {/* Donation Cards */}
      {filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-20 text-lg">
          No donations in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((donation) => (
            <DonationCard
              key={donation._id}
              donation={donation}
              onFulfill={handleFulfill}
              fulfilling={fulfilling}
            />
          ))}
        </div>
      )}

    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

// ─── Donation Card ────────────────────────────────────────────────────────────
function DonationCard({ donation, onFulfill, fulfilling }) {
  const { _id, schoolId, itemName, quantity, status, pledgedDate, fulfilledDate } = donation;

  const statusStyle = {
    Open: "bg-[#207D86]/10 text-[#207D86]",
    Pledged: "bg-yellow-500/10 text-yellow-500",
    Fulfilled: "bg-green-500/10 text-green-500",
  };

  const statusIcon = {
    Pledged: "⏳",
    Fulfilled: "✅",
    Open: "📋",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-1">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-[#0A1D32] text-base">{itemName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            🏫 {schoolId?.name || "Verified School"}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[status]}`}>
          {statusIcon[status]} {status}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 text-xs text-slate-400">
        <span>📦 Quantity: <strong className="text-slate-700">{quantity}</strong></span>
        {pledgedDate && (
          <span>📅 Pledged: <strong className="text-slate-700">{new Date(pledgedDate).toLocaleDateString()}</strong></span>
        )}
        {fulfilledDate && (
          <span>🎉 Fulfilled: <strong className="text-slate-700">{new Date(fulfilledDate).toLocaleDateString()}</strong></span>
        )}
      </div>

      {/* Footer */}
      {status === "Pledged" && (
        <div className="mt-auto pt-3 border-t border-slate-100">
          <button
            onClick={() => onFulfill(_id)}
            disabled={fulfilling === _id}
            className="w-full py-2 text-sm rounded-xl font-medium bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
          >
            {fulfilling === _id ? "Updating..." : "Mark as Fulfilled ✅"}
          </button>
        </div>
      )}

    </div>
  );
}