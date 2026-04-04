import ResourceRequest from "../models/ResourceRequest.js";
import User from "../models/User.js";

// ─── GET ALL NEEDS — Browse Needs Tab ────────────────────────────────────────
// GET /api/donations
export const getAllNeeds = async (req, res) => {
  try {
    const { urgency, status, search } = req.query;

 const filter = {};

    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;
    if (search) {
      filter.itemName = { $regex: search, $options: "i" };
    }

    const needs = await ResourceRequest.find(filter)
      .populate("schoolId", "name email isVerified")
      .populate("donorId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(needs);
  } catch (err) {
    console.error("getAllNeeds error:", err);
    res.status(500).json({ message: "Server error fetching needs" });
  }
};

// ─── PLEDGE A DONATION — Browse Needs Tab ────────────────────────────────────
// PUT /api/donations/:id/pledge
export const pledgeDonation = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.id);

    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    // Prevent duplicate pledge
    if (need.status !== "Open") {
      return res.status(400).json({
        message: `This item is already ${need.status}. Cannot pledge again.`,
      });
    }

    need.status = "Pledged";
    need.donorId = req.user._id;
    need.pledgedDate = new Date();

    await need.save();

    const updated = await ResourceRequest.findById(need._id).populate(
      "schoolId",
      "name email"
    );

    res.status(200).json({ message: "Pledge successful", need: updated });
  } catch (err) {
    console.error("pledgeDonation error:", err);
    res.status(500).json({ message: "Server error while pledging" });
  }
};

// ─── GET MY DONATIONS — My Donations Tab ─────────────────────────────────────
// GET /api/donations/my
export const getMyDonations = async (req, res) => {
  try {
    const donations = await ResourceRequest.find({ donorId: req.user._id })
      .populate("schoolId", "name email")
      .sort({ pledgedDate: -1 });

    res.status(200).json(donations);
  } catch (err) {
    console.error("getMyDonations error:", err);
    res.status(500).json({ message: "Server error fetching your donations" });
  }
};

// ─── MARK AS FULFILLED — My Donations Tab ────────────────────────────────────
// PUT /api/donations/:id/complete
export const markFulfilled = async (req, res) => {
  try {
    const need = await ResourceRequest.findById(req.params.id);

    if (!need) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (need.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your donation" });
    }

    if (need.status !== "Pledged") {
      return res.status(400).json({
        message: "Can only complete a pledged donation",
      });
    }

    need.status = "Fulfilled";
    need.fulfilledDate = new Date();

    await need.save();

    res.status(200).json({ message: "Marked as fulfilled", need });
  } catch (err) {
    console.error("markFulfilled error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── OVERVIEW STATS — Overview Tab ───────────────────────────────────────────
// GET /api/donations/overview
export const getOverviewStats = async (req, res) => {
  try {
    const donorId = req.user._id;

    const allDonations = await ResourceRequest.find({ donorId })
      .populate("schoolId", "name")
      .sort({ pledgedDate: -1 });

    const total = allDonations.length;
    const pending = allDonations.filter((d) => d.status === "Pledged").length;
    const fulfilled = allDonations.filter((d) => d.status === "Fulfilled").length;
    const totalItems = allDonations.reduce((sum, d) => sum + d.quantity, 0);
    const schoolsSupported = [
      ...new Set(
        allDonations
          .filter((d) => d.schoolId)
          .map((d) => d.schoolId._id.toString())
      ),
    ].length;

    // Recent 5 donations
    const recentDonations = allDonations.slice(0, 5);

    // Top 3 urgent open needs
    const verifiedSchools = await User.find({
      role: "schoolAdmin",
      isVerified: true,
    }).select("_id");

    const verifiedIds = verifiedSchools.map((s) => s._id);

    const urgentNeeds = await ResourceRequest.find({
      schoolId: { $in: verifiedIds },
      urgency: "High",
      status: "Open",
    })
      .populate("schoolId", "name")
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      total,
      pending,
      fulfilled,
      totalItems,
      schoolsSupported,
      recentDonations,
      urgentNeeds,
    });
  } catch (err) {
    console.error("getOverviewStats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── IMPACT REPORT — Impact Reports Tab ──────────────────────────────────────
// GET /api/donations/impact
export const getImpactReport = async (req, res) => {
  try {
    const donorId = req.user._id;

    const fulfilled = await ResourceRequest.find({
      donorId,
      status: "Fulfilled",
    }).populate("schoolId", "name");

    const totalItems = fulfilled.reduce((sum, d) => sum + d.quantity, 0);

    const schoolsSupported = [
      ...new Set(
        fulfilled
          .filter((d) => d.schoolId)
          .map((d) => d.schoolId._id.toString())
      ),
    ].length;

    // Most donated item
    const itemCounts = {};
    fulfilled.forEach((d) => {
      itemCounts[d.itemName] = (itemCounts[d.itemName] || 0) + d.quantity;
    });
    const mostDonated =
      Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // This month stats
    const now = new Date();
    const thisMonth = fulfilled.filter((d) => {
      if (!d.fulfilledDate) return false;
      const date = new Date(d.fulfilledDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const thisMonthItems = thisMonth.reduce((sum, d) => sum + d.quantity, 0);
    const thisMonthSchools = [
      ...new Set(
        thisMonth
          .filter((d) => d.schoolId)
          .map((d) => d.schoolId._id.toString())
      ),
    ].length;

    // Transparency log
    const log = fulfilled.map((d) => ({
      item: d.itemName,
      quantity: d.quantity,
      school: d.schoolId?.name,
      date: d.fulfilledDate,
    }));

    res.status(200).json({
      totalItemsDonated: totalItems,
      totalSchoolsSupported: schoolsSupported,
      mostDonatedItem: mostDonated,
      thisMonthItems,
      thisMonthSchools,
      log,
    });
  } catch (err) {
    console.error("getImpactReport error:", err);
    res.status(500).json({ message: "Server error" });
  }
};