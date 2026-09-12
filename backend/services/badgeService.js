// services/badgeService.js
// Matches the actual JanaSakshi schema: complaints(user_id, status, resolved_by,
// feedback_rating, created_at, updated_at) — no separate verification flag and
// the feedback table is unused, so we read feedback_rating directly.

const db = require("../db"); // adjust this line if db.js exports differently — see note at bottom

// ---- Badge tier data ----

const CITIZEN_BADGES = [
  { id: "aware_citizen", nameHindi: "जागरूक नागरिक", nameEnglish: "Aware Citizen", required: 1, coinReward: 10, perks: ["Base reward"] },
  { id: "active_citizen", nameHindi: "सक्रिय नागरिक", nameEnglish: "Active Citizen", required: 5, coinReward: 20, perks: ["Badge icon on profile"] },
  { id: "regular_citizen", nameHindi: "नियमित नागरिक", nameEnglish: "Regular Citizen", required: 10, coinReward: 35, perks: ["Faster AI triage"] },
  { id: "community_hero", nameHindi: "समाज सेवक", nameEnglish: "Community Hero", required: 15, coinReward: 50, perks: ["Priority resolution queue"] },
  { id: "super_leader", nameHindi: "सुपर लीडर", nameEnglish: "Super Leader", required: 30, coinReward: 100, perks: ["VIP support", "Gift voucher"] },
];

const OFFICER_BADGES = [
  { id: "quick_responder", nameHindi: "त्वरित समाधानकर्ता", nameEnglish: "Quick Responder", required: 5, maxAvgResponseHours: 72, coinReward: 50, perks: ["Official digital certificate"] },
  { id: "star_resolver", nameHindi: "स्टार ऑफिसर", nameEnglish: "Star Resolver", required: 20, maxAvgResponseHours: 60, coinReward: 250, perks: ["Monthly Star Officer banner"] },
  { id: "department_champion", nameHindi: "विभाग चैंपियन", nameEnglish: "Department Champion", required: 50, maxAvgResponseHours: 48, coinReward: 700, perks: ["Appreciation letter"] },
  { id: "master_administrator", nameHindi: "मास्टर एडमिनिस्ट्रेटर", nameEnglish: "Master Administrator", required: 100, maxAvgResponseHours: 40, coinReward: 1500, perks: ["Performance bonus voucher"] },
];

// ---- DB access ----

async function getVerifiedComplaintCount(userId) {
  const result = await db.query(
    `SELECT COUNT(*) AS count FROM complaints WHERE user_id = $1`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function getOfficerResolutionStats(officerId) {
  const result = await db.query(
    `SELECT
       COUNT(*) AS count,
       AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS avg_hours
     FROM complaints
     WHERE resolved_by = $1
       AND status = 'resolved'
       AND feedback_rating IS NOT NULL`,
    [officerId]
  );
  const row = result.rows[0];
  return {
    citizenConfirmedResolutions: parseInt(row.count, 10),
    avgResponseHours: row.avg_hours === null ? Infinity : parseFloat(row.avg_hours),
  };
}

// ---- Tier calculation (pure, no DB) ----

function computeCitizenBadge(verifiedComplaints) {
  const sorted = [...CITIZEN_BADGES].sort((a, b) => a.required - b.required);
  let current = null;
  let next = null;
  for (const badge of sorted) {
    if (verifiedComplaints >= badge.required) {
      current = badge;
    } else {
      next = badge;
      break;
    }
  }
  const floor = current ? current.required : 0;
  const progressToNext = next
    ? Math.min(1, (verifiedComplaints - floor) / (next.required - floor))
    : 1;
  return { current, next, progressToNext };
}

function computeOfficerBadge(citizenConfirmedResolutions, avgResponseHours) {
  const sorted = [...OFFICER_BADGES].sort((a, b) => a.required - b.required);
  let current = null;
  let next = null;
  for (const badge of sorted) {
    const meetsVolume = citizenConfirmedResolutions >= badge.required;
    const meetsSpeed = avgResponseHours <= badge.maxAvgResponseHours;
    if (meetsVolume && meetsSpeed) {
      current = badge;
    } else {
      next = badge;
      break;
    }
  }
  const floor = current ? current.required : 0;
  const progressToNext = next
    ? Math.min(1, (citizenConfirmedResolutions - floor) / (next.required - floor))
    : 1;
  return { current, next, progressToNext };
}

module.exports = {
  CITIZEN_BADGES,
  OFFICER_BADGES,
  getVerifiedComplaintCount,
  getOfficerResolutionStats,
  computeCitizenBadge,
  computeOfficerBadge,
};

// NOTE on the `require("../db")` line at the top:
// - If db.js has `module.exports = pool;` (a raw pg Pool) → this file works as-is.
// - If db.js has `module.exports = { query };` → change the top line to:
//     const { query: dbQuery } = require("../db");
//   and replace `db.query(...)` with `dbQuery(...)` in both functions above.