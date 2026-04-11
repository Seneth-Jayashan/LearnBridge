// src/pages/schoolAdmin/NeedsRegistry.jsx
import { useEffect, useState } from "react";
import {
  createNeed,
  getMyPostedNeeds,
  updateNeed,
  deleteNeed,
  getDonorDetails,
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
  targetGroup: "",
  condition: "Any",
};

export default function NeedsRegistry() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [donorModal, setDonorModal] = useState(null);
  const [donorLoading, setDonorLoading] = useState(false);
  const [viewNeed, setViewNeed] = useState(null);

  useEffect(() => { fetchNeeds(); }, []);

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
      targetGroup: need.targetGroup || "",
      condition: need.condition || "Any",
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
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        itemName: form.itemName,
        quantity: form.quantity,
        amount: Number(form.amount),
        description: form.description,
        urgency: form.urgency,
        targetGroup: form.targetGroup,
        condition: form.condition,
      };

      if (editingId) {
        await updateNeed(editingId, payload);
        toast.success("Need updated successfully ✅");
      } else {
        await createNeed(payload);
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

  const handleDeleteClick = (id) => setConfirmDeleteId(id);

  const handleConfirmDelete = async () => {
    try {
      setDeleting(confirmDeleteId);
      setConfirmDeleteId(null);
      await deleteNeed(confirmDeleteId);
      toast.success("Need deleted 🗑️");
      fetchNeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete.");
    } finally {
      setDeleting(null);
    }
  };

  const handleViewDonor = async (needId) => {
    try {
      setDonorLoading(true);
      const res = await getDonorDetails(needId);
      setDonorModal(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load donor details.");
    } finally {
      setDonorLoading(false);
    }
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
    <div className="p-4 sm:p-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0A1D32]">Needs Registry</h1>
          <p className="text-slate-500 text-sm mt-0.5">Post and manage your school's resource requirements.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        >
          + Post New Need
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 mb-8">
        <StatCard icon="📋" label="Total Posted" value={total} gradient="from-[#207D86] to-[#4CAF50]" />
        <StatCard icon="🟢" label="Open" value={open} gradient="from-blue-500 to-blue-600" />
        <StatCard icon="⏳" label="Pledged" value={pledged} gradient="from-yellow-400 to-yellow-500" />
        <StatCard icon="✅" label="Fulfilled" value={fulfilled} gradient="from-green-400 to-green-600" />
      </div>

      {/* Table */}
      {needs.length === 0 ? (
        <div className="text-center text-slate-400 py-20 text-lg">
          No needs posted yet. Click "+ Post New Need" to get started.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                    <td className="px-6 py-4">
                      <p
                        className="font-semibold text-[#0A1D32] cursor-pointer hover:text-[#207D86] transition"
                        onClick={() => setViewNeed(need)}
                      >
                        {need.itemName}
                      </p>
                      {need.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{need.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{need.quantity}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {need.amount > 0 ? `Rs. ${need.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urgencyColor[need.urgency]}`}>
                        {need.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        need.status === "Open" ? "bg-[#207D86]/10 text-[#207D86]"
                        : need.status === "Pledged" ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-green-500/10 text-green-500"
                      }`}>
                        {need.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(need.createdAt).toLocaleDateString()}
                    </td>
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
                              onClick={() => handleDeleteClick(need._id)}
                              disabled={deleting === need._id}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                            >
                              {deleting === need._id ? "..." : "Delete"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleViewDonor(need._id)}
                            disabled={donorLoading}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#207D86]/10 text-[#207D86] hover:bg-[#207D86]/20 transition"
                          >
                            {donorLoading ? "..." : "View Donor 👤"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4">
            {needs.map((need) => (
              <div
                key={need._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p
                      className="font-semibold text-[#0A1D32] text-sm cursor-pointer hover:text-[#207D86] transition"
                      onClick={() => setViewNeed(need)}
                    >
                      {need.itemName}
                    </p>
                    {need.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{need.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${urgencyColor[need.urgency]}`}>
                    {need.urgency}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>📦 Qty: <strong className="text-slate-700">{need.quantity}</strong></span>
                  <span>💰 <strong className="text-slate-700">
                    {need.amount > 0 ? `Rs. ${need.amount.toLocaleString()}` : "—"}
                  </strong></span>
                  <span>📅 {new Date(need.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    need.status === "Open" ? "bg-[#207D86]/10 text-[#207D86]"
                    : need.status === "Pledged" ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-green-500/10 text-green-500"
                  }`}>
                    {need.status}
                  </span>

                  {need.status === "Open" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(need)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#207D86]/10 text-[#207D86] hover:bg-[#207D86]/20 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(need._id)}
                        disabled={deleting === need._id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        {deleting === need._id ? "..." : "Delete"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleViewDonor(need._id)}
                      disabled={donorLoading}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#207D86]/10 text-[#207D86] hover:bg-[#207D86]/20 transition"
                    >
                      {donorLoading ? "..." : "View Donor 👤"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Post/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-7 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            <h2 className="text-lg font-bold text-[#0A1D32]">
              {editingId ? "Edit Need" : "Post New Need"}
            </h2>

            {/* Item Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Item Name *</label>
              <input
                type="text"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder='e.g. "Geometry Boxes"'
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
              />
            </div>

            {/* Quantity + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 5"
                  className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (LKR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">Rs.</span>
                  <input
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="2500"
                    className="w-full rounded-xl pl-8 pr-3 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. 100-page notebooks, A4 size needed for upcoming semester"
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32] resize-none"
              />
            </div>

            {/* Target Group */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Who Needs It</label>
              <select
                value={form.targetGroup}
                onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
              >
                <option value="">-- Select group --</option>
                <option value="All Students">👨‍🎓 All Students</option>
                <option value="Primary Students (Grades 1–5)">📚 Primary Students (Grades 1–5)</option>
                <option value="Secondary Students (Grades 6–11)">📖 Secondary Students (Grades 6–11)</option>
                <option value="A/L Students (Grades 12–13)">🎓 A/L Students (Grades 12–13)</option>
                <option value="Teachers">👩‍🏫 Teachers</option>
                <option value="Special Needs Students">💛 Special Needs Students</option>
                <option value="School Staff">🏫 School Staff</option>
              </select>
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32]"
              >
                <option value="Any">Any</option>
                <option value="New">🆕 New</option>
                <option value="Used - Good">♻️ Used - Good</option>
              </select>
            </div>

            {/* Urgency */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Urgency</label>
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
                className="flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Need" : "Post Need 📢"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">🗑️</div>
              <h2 className="text-lg font-bold text-[#0A1D32]">Delete Need?</h2>
              <p className="text-sm text-slate-400">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-6 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Need Details Modal ── */}
      {viewNeed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A1D32]">Need Details</h2>
              <button onClick={() => setViewNeed(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0A1D32]">{viewNeed.itemName}</h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urgencyColor[viewNeed.urgency]}`}>
                {viewNeed.urgency}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <InfoRow icon="📦" label="Quantity" value={viewNeed.quantity} />
              <InfoRow icon="💰" label="Amount" value={viewNeed.amount > 0 ? `Rs. ${viewNeed.amount.toLocaleString()}` : "—"} />
              <InfoRow icon="📝" label="Description" value={viewNeed.description || "—"} />
              <InfoRow icon="👥" label="Who Needs It" value={viewNeed.targetGroup || "—"} />
              <InfoRow icon="🏷️" label="Condition" value={viewNeed.condition || "—"} />
              <InfoRow icon="📅" label="Posted On" value={new Date(viewNeed.createdAt).toLocaleDateString()} />
              <InfoRow
                icon="✅"
                label="Status"
                value={
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    viewNeed.status === "Open" ? "bg-[#207D86]/10 text-[#207D86]"
                    : viewNeed.status === "Pledged" ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-green-500/10 text-green-500"
                  }`}>
                    {viewNeed.status}
                  </span>
                }
              />
            </div>

            <button
              onClick={() => setViewNeed(null)}
              className="w-full py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Donor Details Modal ── */}
      {donorModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0A1D32]">Donor Details</h2>
              <button onClick={() => setDonorModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
              <div className="w-14 h-14 rounded-full bg-linear-to-r from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white text-xl font-bold shadow">
                {donorModal.donor?.firstName?.charAt(0)}{donorModal.donor?.lastName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#0A1D32]">{donorModal.donor?.firstName} {donorModal.donor?.lastName}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#207D86]/10 text-[#207D86] font-semibold capitalize">
                  {donorModal.donor?.role}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact Information</p>
              <InfoRow icon="📧" label="Email" value={donorModal.donor?.email} />
              <InfoRow icon="📞" label="Phone" value={donorModal.donor?.phoneNumber || "—"} />
              <InfoRow
                icon="📍"
                label="Address"
                value={
                  donorModal.donor?.address?.street
                    ? `${donorModal.donor.address.street}, ${donorModal.donor.address.city || ""}`
                    : "—"
                }
              />
              <InfoRow
                icon="📅"
                label="Member Since"
                value={
                  donorModal.donor?.createdAt
                    ? new Date(donorModal.donor.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "—"
                }
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Donation Details</p>
              <InfoRow icon="📦" label="Item" value={donorModal.need?.itemName} />
              <InfoRow icon="🔢" label="Quantity" value={donorModal.need?.quantity} />
              <InfoRow icon="💰" label="Amount" value={donorModal.need?.amount > 0 ? `Rs. ${donorModal.need.amount.toLocaleString()}` : "Material Donation"} />
              <InfoRow icon="💳" label="Payment Method" value={donorModal.need?.paymentMethod || "Pledge (Material)"} />
              <InfoRow icon="✅" label="Status" value={donorModal.need?.status} />
              <InfoRow icon="📅" label="Pledged Date" value={donorModal.need?.pledgedDate ? new Date(donorModal.need.pledgedDate).toLocaleDateString() : "—"} />
              {donorModal.need?.fulfilledDate && (
                <InfoRow icon="🎉" label="Fulfilled Date" value={new Date(donorModal.need.fulfilledDate).toLocaleDateString()} />
              )}
            </div>

            <button onClick={() => setDonorModal(null)} className="w-full py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <div className="text-[#0A1D32] font-medium mt-0.5">{value || "—"}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, gradient }) {
  return (
    <div className={`bg-linear-to-r ${gradient} rounded-2xl p-4 sm:p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/70 font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-2xl sm:text-3xl">{icon}</span>
      </div>
    </div>
  );
}