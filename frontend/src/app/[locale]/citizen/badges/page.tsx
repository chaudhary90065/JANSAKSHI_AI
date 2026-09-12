"use client";

import { useEffect, useState } from "react";
import "./badges.css";

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

// This page assumes a logged-in citizen. It calls your own backend endpoint
// (see index.js.snippet) — adjust the fetch URL/userId source to however you
// currently read the logged-in user (session, cookie, context, etc.).
export default function BadgesPage() {
  const [track, setTrack] = useState("citizen");
  const [verifiedComplaints, setVerifiedComplaints] = useState(undefined);

  useEffect(() => {
    // TODO: replace with your real logged-in user id (from session/auth context)
    const userId = null;
    if (!userId) return;

    fetch(`http://localhost:5000/api/badges/citizen/${userId}`)
      .then((r) => r.json())
      .then((data) => setVerifiedComplaints(data.verifiedComplaints))
      .catch(() => setVerifiedComplaints(undefined));
  }, []);

  return (
    <div className="jb-page">
      <header className="jb-header">
        <h1 className="jb-title">आपकी यात्रा, आपके बैज</h1>
        <p className="jb-subtitle">
          Every verified complaint moves you one rung up the ladder — Hindi
          badge names on the ground, English underneath.
        </p>
      </header>

      <div className="jb-track-switch" role="tablist" aria-label="Badge track">
        <button
          role="tab"
          aria-selected={track === "citizen"}
          className={track === "citizen" ? "jb-tab jb-tab--active" : "jb-tab"}
          onClick={() => setTrack("citizen")}
        >
          Citizen Badges
        </button>
        <button
          role="tab"
          aria-selected={track === "officer"}
          className={track === "officer" ? "jb-tab jb-tab--active" : "jb-tab"}
          onClick={() => setTrack("officer")}
        >
          Officer Badges
        </button>
      </div>

      {track === "citizen" ? (
        <ol className="jb-ladder jb-ladder--citizen">
          {CITIZEN_BADGES.map((badge, i) => {
            const reached =
              verifiedComplaints !== undefined &&
              verifiedComplaints >= badge.required;
            return (
              <li key={badge.id} className={reached ? "jb-rung jb-rung--reached" : "jb-rung"}>
                <div className="jb-rung-marker">{i + 1}</div>
                <div className="jb-rung-body">
                  <div className="jb-rung-heading">
                    <span className="jb-name-hi">{badge.nameHindi}</span>
                    <span className="jb-name-en">{badge.nameEnglish}</span>
                  </div>
                  <div className="jb-rung-meta">
                    {badge.required} verified complaint{badge.required > 1 ? "s" : ""} ·{" "}
                    {badge.coinReward} coins
                  </div>
                  <ul className="jb-perks">
                    {badge.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="jb-ladder jb-ladder--officer">
          {OFFICER_BADGES.map((badge, i) => (
            <li key={badge.id} className="jb-rung">
              <div className="jb-rung-marker">{i + 1}</div>
              <div className="jb-rung-body">
                <div className="jb-rung-heading">
                  <span className="jb-name-hi">{badge.nameHindi}</span>
                  <span className="jb-name-en">{badge.nameEnglish}</span>
                </div>
                <div className="jb-rung-meta">
                  {badge.required} citizen-confirmed resolutions · avg response
                  under {badge.maxAvgResponseHours}h · {badge.coinReward} coins
                </div>
                <ul className="jb-perks">
                  {badge.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="jb-footnote">
        Counts only verified complaints and citizen-confirmed resolutions —
        not raw submissions or self-marked &quot;resolved&quot; — so badges
        reflect real outcomes.
      </p>
    </div>
  );
}