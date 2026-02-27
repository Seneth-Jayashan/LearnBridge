// src/pages/donor/BrowseNeeds.jsx
import { useEffect, useState } from "react";
import { getAllNeeds, pledgeDonation, initiatePayment, confirmPayment } from "../../services/donorServices";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 6;

const urgencyColor = {
  High: "bg-red-500/10 text-red-400 border border-red-500/30",
  Medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  Low: "bg-green-500/10 text-green-400 border border-green-500/30",
};

export default function BrowseNeeds() {
  const [needs, setNeeds] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState(null);
  const [paying, setPaying] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    search: "",
    urgency: "",
    status: "",
  });

  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const res = await getAllNeeds();
      setNeeds(res.data);
      setFiltered(res.data);
    } catch (err) {
      toast.error("Failed to load needs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...needs];
    if (filters.search) {
      result = result.filter((n) =>
        n.itemName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.urgency) {
      result = result.filter((n) => n.urgency === filters.urgency);
    }
    if (filters.status) {
      result = result.filter((n) => n.status === filters.status);
    }
    setFiltered(result);
    setCurrentPage(1);
  }, [filters, needs]);

  // ── Pledge (material donation) ─────────────────────────────
  const handlePledge = async (id) => {
    try {
      setPledging(id);
      await pledgeDonation(id);
      toast.success("Thank you for supporting this school ❤️");
      fetchNeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not pledge.");
    } finally {
      setPledging(null);
    }
  };

  // ── Pay (financial donation via PayHere) ───────────────────
const handlePay = async (id) => {
  try {
    setPaying(id);

    if (!window.payhere) {
      toast.error("Payment system not available. Try refreshing.");
      return;
    }

    const res = await initiatePayment(id);
    const paymentData = res.data;

    // ── onCompleted: fires when payment approved ──────────────
    window.payhere.onCompleted = async function (orderId) {
      try {
        console.log("Payment completed, orderId:", orderId);
        await confirmPayment({
          orderId: orderId,
          needId: id,
        });
        toast.success("Payment successful! Thank you ❤️");
        fetchNeeds(); // ← refreshes cards → shows Pledged
      } catch (err) {
        console.error("Confirm error:", err);
        toast.error("Payment done but confirmation failed.");
      }
    };

    window.payhere.onDismissed = function () {
      toast.error("Payment cancelled.");
      fetchNeeds();
    };

    window.payhere.onError = function (error) {
      toast.error("Payment error: " + error);
    };

    window.payhere.startPayment(paymentData);
  } catch (err) {
    toast.error(err.response?.data?.message || err.message);
  } finally {
    setPaying(null);
  }
};
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4CAF50]" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">

      <h1 className="text-2xl font-bold text-[#0A1D32] mb-1">Browse School Needs</h1>
      <p className="text-slate-500 text-sm mb-6">
        Support verified schools by pledging or donating.
      </p>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-5 rounded-2xl border border-white/40 shadow-lg backdrop-blur-sm">
        <input
          type="text"
          placeholder="Search item..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="rounded-xl px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition w-52"
        />

        <select
          value={filters.urgency}
          onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
          className="rounded-xl px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
        >
          <option value="">All Urgency</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-xl px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="Pledged">Pledged</option>
          <option value="Fulfilled">Fulfilled</option>
        </select>

        <button
          onClick={() => setFilters({ search: "", urgency: "", status: "" })}
          className="ml-auto text-sm font-medium text-[#207D86] hover:text-[#4CAF50] transition"
        >
          Clear Filters
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-5">
        Showing {paginated.length} of {filtered.length} results
      </p>

      {/* Cards */}
      {paginated.length === 0 ? (
        <div className="text-center text-slate-400 py-20 text-lg">
          No needs found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((need) => (
            <NeedCard
              key={need._id}
              need={need}
              onPledge={handlePledge}
              onPay={handlePay}
              pledging={pledging}
              paying={paying}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === page
                  ? "bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-[#207D86]/10"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Need Card ────────────────────────────────────────────────────────────────
function NeedCard({ need, onPledge, onPay, pledging, paying }) {
  const { _id, schoolId, itemName, quantity, amount, description, urgency, status, pledgedDate } = need;

  const statusStyle = {
    Open: "bg-[#207D86]/10 text-[#207D86]",
    Pledged: "bg-yellow-500/10 text-yellow-500",
    Fulfilled: "bg-green-500/10 text-green-500",
  };

  const isOpen = status === "Open";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-[#0A1D32] text-base">{itemName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            🏫 {schoolId?.name || "Verified School"}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${urgencyColor[urgency]}`}>
          {urgency}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-2">
        {description || "No description"}
      </p>

      {/* Info Row */}
      <div className="flex gap-4 text-xs text-slate-400">
        <span>
          📦 Qty: <strong className="text-slate-700">{quantity}</strong>
        </span>
        {amount > 0 && (
          <span>
            💰 Rs. <strong className="text-slate-700">{amount.toLocaleString()}</strong>
          </span>
        )}
        {pledgedDate && (
          <span>📅 {new Date(pledgedDate).toLocaleDateString()}</span>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[status]}`}>
          {status}
        </span>
      </div>

      {/* Action Buttons */}
      {isOpen ? (
        <div className="flex gap-2">

          {/* Pledge — material donation */}
          <button
            onClick={() => onPledge(_id)}
            disabled={pledging === _id || paying === _id}
            className="flex-1 py-2 text-sm rounded-xl font-medium border-2 border-[#207D86] text-[#207D86] hover:bg-[#207D86]/10 transition-all duration-200 disabled:opacity-50"
          >
            {pledging === _id ? "Pledging..." : "Pledge 🤝"}
          </button>

          {/* Pay — financial donation */}
          {amount > 0 && (
            <button
              onClick={() => onPay(_id)}
              disabled={paying === _id || pledging === _id}
              className="flex-1 py-2 text-sm rounded-xl font-medium bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
            >
              {paying === _id ? "Processing..." : "Pay 💳"}
            </button>
          )}

        </div>
      ) : (
        <div className="text-center py-1">
          <span className={`text-xs font-semibold px-4 py-1.5 rounded-full ${statusStyle[status]}`}>
            {status}
          </span>
        </div>
      )}

    </div>
  );
}