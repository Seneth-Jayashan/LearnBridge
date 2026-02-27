// src/pages/schoolAdmin/NeedsRegistry.jsx
import { useEffect, useState } from "react";
import {
  createNeed,
  getMyPostedNeeds,
  updateNeed,
  deleteNeed,
} from "../../services/donorServices";
import { toast } from "react-toastify";

const urgencyColor = {
  High: "bg-red-500/10 text-red-400 border border-red-500/30",
  Medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  Low: "bg-green-500/10 text-green-400 border border-green-500/30",
};

const emptyForm = {
  itemName: "",
  quantity: "",
  amount: "",
  description: "",
  urgency: "Medium",
};

export default function NeedsRegistry() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchNeeds();
  }, []);

  const toastConfirm = (message, onConfirm) => {
    const id = toast.info(
      <div className="flex flex-col gap-2">
        <span>{message}</span>
        <div className="flex gap-2 justify-end mt-2">
          <button
            onClick={() => {
              toast.dismiss(id);
              onConfirm();
            }}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(id)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            No
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      }
    );
  };

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const res = await getMyPostedNeeds();
      setNeeds(res.data);
    } catch (err) {
      toast.error("Failed to load needs.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (need) => {
    setForm({
      itemName: need.itemName,
      quantity: need.quantity,
      amount: need.amount || "",
      description: need.description || "",
      urgency: need.urgency,
    });
    setEditingId(need._id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.itemName.trim() || !form.quantity) {
      toast.error("Item name and quantity are required.");
      return;
    }
    if (Number(form.quantity) <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }
    // ← validate amount on both create AND edit
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateNeed(editingId, {
          itemName: form.itemName,
          quantity: form.quantity,
          amount: Number(form.amount), // ← add amount here
          description: form.description,
          urgency: form.urgency,
        });
        toast.success("Need updated successfully ✅");
      } else {
        await createNeed(form);
        toast.success("Need posted successfully 📢");
      }
      setShowModal(false);
      fetchNeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    toastConfirm("Are you sure you want to delete this need?", async () => {
      try {
        setDeleting(id);
        await deleteNeed(id);
        toast.success("Need deleted 🗑️");
        fetchNeeds();
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not delete.");
      } finally {
        setDeleting(null);
      }
    });
  };

  const total = needs.length;
  const open = needs.filter((n) => n.status === "Open").length;
  const pledged = needs.filter((n) => n.status === "Pledged").length;
  const fulfilled = needs.filter((n) => n.status === "Fulfilled").length;

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
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1D32]">Needs Registry</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Post and manage your school's resource requirements.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        >
          + Post New Need
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        <StatCard icon="📋" label="Total Posted" value={total} gradient="from-[#207D86] to-[#4CAF50]" />
        <StatCard icon="🟢" label="Open" value={open} gradient="from-blue-500 to-blue-600" />
        <StatCard icon="⏳" label="Pledged" value={pledged} gradient="from-yellow-400 to-yellow-500" />
        <StatCard icon="✅" label="Fulfilled" value={fulfilled} gradient="from-green-400 to-green-600" />
      </div>

      {/* Needs Table */}
      {needs.length === 0 ? (
        <div className="text-center text-slate-400 py-20 text-lg">
          No needs posted yet. Click "+ Post New Need" to get started.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest">
                <th className="text-left px-6 py-4 font-semibold">Item</th>
                <th className="text-left px-6 py-4 font-semibold">Qty</th>
                <th className="text-left px-6 py-4 font-semibold">Amount (LKR)</th>
                <th className="text-left px-6 py-4 font-semibold">Urgency</th>
                <th className="text-left px-6 py-4 font-semibold">Status</th>
                <th className="text-left px-6 py-4 font-semibold">Posted</th>
                <th className="text-right px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {needs.map((need, index) => (
                <tr
                  key={need._id}
                  className={`border-t border-slate-50 hover:bg-[#207D86]/5 transition-all duration-150 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {/* Item */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#0A1D32]">{need.itemName}</p>
                    {need.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {need.description}
                      </p>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {need.quantity}
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {need.amount > 0
                      ? `Rs. ${need.amount.toLocaleString()}`
                      : "—"}
                  </td>

                  {/* Urgency */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urgencyColor[need.urgency]}`}>
                      {need.urgency}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      need.status === "Open"
                        ? "bg-[#207D86]/10 text-[#207D86]"
                        : need.status === "Pledged"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-green-500/10 text-green-500"
                    }`}>
                      {need.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(need.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      {need.status === "Open" ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(need)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#207D86]/10 text-[#207D86] hover:bg-[#207D86]/20 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(need._id)}
                            disabled={deleting === need._id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                          >
                            {deleting === need._id ? "..." : "Delete"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300 italic">
                          Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5">

            <h2 className="text-lg font-bold text-[#0A1D32]">
              {editingId ? "Edit Need" : "Post New Need"}
            </h2>

            {/* Item Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Item Name *
              </label>
              <input
                type="text"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder='e.g. "Geometry Boxes"'
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
              />
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 5"
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
              />
            </div>

            {/* Amount — fully editable */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estimated Amount (LKR) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  Rs.
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 2500"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Any additional details..."
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32] resize-none"
              />
            </div>

            {/* Urgency */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Urgency
              </label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Need" : "Post Need 📢"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, gradient }) {
  return (
    <div className={`bg-linear-to-r ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
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