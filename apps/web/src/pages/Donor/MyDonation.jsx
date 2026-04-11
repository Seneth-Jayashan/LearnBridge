// src/pages/donor/MyDonations.jsx
import { useEffect, useState } from "react";
import { getMyDonations, markFulfilled } from "../../services/donorServices";
import { toast } from "react-toastify";

const tabs = ["All", "Pending", "Completed"];

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [fulfilling, setFulfilling] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => { fetchMyDonations(); }, []);

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
      toast.success("Marked as fulfilled! 🎉 Thank you for completing your donation!");
      fetchMyDonations();
      setSelectedDonation(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update. Please try again.");
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
    <div className="p-4 sm:p-8 min-h-screen">

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
                ? "bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white shadow-md"
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

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-20 text-lg">No donations in this category yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((donation) => (
            <DonationCard
              key={donation._id}
              donation={donation}
              onFulfill={handleFulfill}
              fulfilling={fulfilling}
              onClick={() => setSelectedDonation(donation)}
            />
          ))}
        </div>
      )}

      {/* ── Donation Detail Modal ── */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A1D32]">Donation Details</h2>
              <button onClick={() => setSelectedDonation(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4">
              <div className="text-4xl">
                {selectedDonation.status === "Fulfilled" ? "🎉" : selectedDonation.status === "Pledged" ? "⏳" : "📋"}
              </div>
              <div>
                <p className="font-bold text-[#0A1D32]">{selectedDonation.itemName}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  selectedDonation.status === "Pledged" ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-green-500/10 text-green-500"
                }`}>
                  {selectedDonation.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <DRow icon="🏫" label="School" value={selectedDonation.schoolId?.name || "Verified School"} />
              <DRow icon="📦" label="Quantity" value={selectedDonation.quantity} />
              {selectedDonation.amount > 0 && (
                <DRow icon="💰" label="Amount Paid" value={`Rs. ${selectedDonation.amount?.toLocaleString()}`} />
              )}
              {selectedDonation.paymentMethod && (
                <DRow icon="💳" label="Payment Method" value={selectedDonation.paymentMethod} />
              )}
              {selectedDonation.pledgedDate && (
                <DRow icon="📅" label="Pledged Date" value={new Date(selectedDonation.pledgedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              )}
              {selectedDonation.fulfilledDate && (
                <DRow icon="🎉" label="Fulfilled Date" value={new Date(selectedDonation.fulfilledDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              )}
              {selectedDonation.description && (
                <DRow icon="📝" label="Description" value={selectedDonation.description} />
              )}
              {selectedDonation.targetGroup && (
                <DRow icon="👥" label="Who Needed It" value={selectedDonation.targetGroup} />
              )}
            </div>

            {/* Mark as Fulfilled button inside modal */}
            {selectedDonation.status === "Pledged" && (
              <button
                onClick={() => handleFulfill(selectedDonation._id)}
                disabled={fulfilling === selectedDonation._id}
                className="w-full py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                {fulfilling === selectedDonation._id ? "Updating..." : "Mark as Fulfilled ✅"}
              </button>
            )}

            <button
              onClick={() => setSelectedDonation(null)}
              className="w-full py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-[#0A1D32] font-medium mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`bg-linear-to-r ${color} rounded-2xl p-5 text-white shadow-lg`}>
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

function DonationCard({ donation, onFulfill, fulfilling, onClick }) {
  const { _id, schoolId, itemName, quantity, status, pledgedDate, fulfilledDate, amount, targetGroup } = donation;

  const statusStyle = {
    Open: "bg-[#207D86]/10 text-[#207D86]",
    Pledged: "bg-yellow-500/10 text-yellow-500",
    Fulfilled: "bg-green-500/10 text-green-500",
  };

  const statusIcon = { Pledged: "⏳", Fulfilled: "✅", Open: "📋" };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-[#0A1D32] text-base">{itemName}</h2>
          <p className="text-xs text-slate-400 mt-1">🏫 {schoolId?.name || "Verified School"}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[status]}`}>
          {statusIcon[status]} {status}
        </span>
      </div>

      {targetGroup && <p className="text-xs text-slate-400">👥 {targetGroup}</p>}

      <div className="flex flex-col gap-1.5 text-xs text-slate-400">
        <span>📦 Quantity: <strong className="text-slate-700">{quantity}</strong></span>
        {amount > 0 && <span>💰 Rs. <strong className="text-slate-700">{amount?.toLocaleString()}</strong></span>}
        {pledgedDate && <span>📅 Pledged: <strong className="text-slate-700">{new Date(pledgedDate).toLocaleDateString()}</strong></span>}
        {fulfilledDate && <span>🎉 Fulfilled: <strong className="text-slate-700">{new Date(fulfilledDate).toLocaleDateString()}</strong></span>}
      </div>

      <div className="pt-1 border-t border-slate-100">
        <p className="text-xs text-slate-300 text-right">Tap for details</p>
      </div>

      {status === "Pledged" && (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onFulfill(_id)}
            disabled={fulfilling === _id}
            className="w-full py-2 text-sm rounded-xl font-medium bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
          >
            {fulfilling === _id ? "Updating..." : "Mark as Fulfilled ✅"}
          </button>
        </div>
      )}
    </div>
  );
}