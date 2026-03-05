import { AppEvent } from "./events";
import { AppState, saveState, todayKey, weekKey } from "./store";

export type Mission = {
  id: string;
  type: "daily" | "weekly";
  title: string;
  desc: string;
  rewardPts: number;
  target: number;
  unit?: string;
  // Event-driven only for missions that are legit to trigger from navigation
  eventType?:
    | "LOGIN_TODAY"
    | "PROFILE_COMPLETED"
    | "REFERRAL_SIGNUP";
  // Derived missions are computed from state, never “triggered”
  derived?: boolean;
};

export const MISSIONS: Mission[] = [
  // Daily
  { id: "d1", type: "daily", title: "Entrar y reclamar", desc: "Entra hoy.", rewardPts: 5, target: 1, eventType: "LOGIN_TODAY" },
  { id: "d2", type: "daily", title: "Perfil afinado", desc: "Completa tu perfil.", rewardPts: 10, target: 1, eventType: "PROFILE_COMPLETED" },
  { id: "d3", type: "daily", title: "Racha", desc: "Se valida entrando mañana.", rewardPts: 8, target: 1, derived: true },

  // Weekly (7)
  { id: "w1", type: "weekly", title: "Constancia", desc: "3 días activos esta semana.", rewardPts: 20, target: 3, derived: true },
  { id: "w2", type: "weekly", title: "Sube 1 nivel", desc: "Sube 1 nivel esta semana.", rewardPts: 35, target: 1, derived: true },
  { id: "w3", type: "weekly", title: "XP Hunter", desc: "Suma 500 XP esta semana.", rewardPts: 25, target: 500, unit: "XP", derived: true },
  { id: "w4", type: "weekly", title: "Referido", desc: "Consigue 1 referido real.", rewardPts: 30, target: 1, derived: true },
  { id: "w5", type: "weekly", title: "Top 50", desc: "Entra Top 50 del ranking.", rewardPts: 40, target: 1, derived: true },
  { id: "w6", type: "weekly", title: "7/7", desc: "Completa 7 retos esta semana.", rewardPts: 45, target: 7, derived: true },
  { id: "w7", type: "weekly", title: "NovaONE", desc: "NovaONE + 2 retos completados.", rewardPts: 30, target: 2, derived: true },
];

export function resetIfNeeded(st: AppState) {
  const dKey = todayKey();
  const wKey = weekKey();

  // daily reset
  if (st.missions.dailyKey !== dKey) {
    st.missions.dailyKey = dKey;
    for (const m of MISSIONS.filter((x) => x.type === "daily")) {
      st.missions.progress[m.id] = 0;
      st.missions.completedAt[m.id] = undefined;
    }
  }

  // weekly reset
  if (st.missions.weeklyKey !== wKey) {
    st.missions.weeklyKey = wKey;
    for (const m of MISSIONS.filter((x) => x.type === "weekly")) {
      st.missions.progress[m.id] = 0;
      st.missions.completedAt[m.id] = undefined;
    }
    st.user.activeDaysThisWeek = [];
    st.user.weeklyMissionCompletions = 0;

    // IMPORTANT: weekly baselines for derived missions
    st.user.weekStartXp = st.user.xp;
    st.user.weekStartLevel = levelFromXp(st.user.xp);
  }
}

function awardPoints(st: AppState, basePts: number, hasNovaOne: boolean) {
  const pts = Math.round(basePts * (hasNovaOne ? 1.2 : 1.0));
  st.user.points += pts;
  return pts;
}

function levelFromXp(xp: number) {
  if (xp >= 30000) return 5;
  if (xp >= 15000) return 4;
  if (xp >= 7000) return 3;
  if (xp >= 3000) return 2;
  if (xp >= 1000) return 1;
  return 0;
}

export function computeRankPos(st: AppState) {
  const sorted = [...st.leaderboard].sort((a, b) => b.xp - a.xp);
  const idx = sorted.findIndex((x) => x.userId === st.user.id);
  return idx >= 0 ? idx + 1 : sorted.length + 999;
}

function recomputeDerived(st: AppState, hasNovaOne: boolean) {
  // w1: active days count
  const w1 = MISSIONS.find((m) => m.id === "w1")!;
  st.missions.progress[w1.id] = Math.min(w1.target, st.user.activeDaysThisWeek.length);

  // w3: XP delta this week
  const w3 = MISSIONS.find((m) => m.id === "w3")!;
  const deltaXp = Math.max(0, st.user.xp - (st.user.weekStartXp ?? st.user.xp));
  st.missions.progress[w3.id] = Math.min(w3.target, deltaXp);

  // w2: level up this week (current level - weekStartLevel)
  const w2 = MISSIONS.find((m) => m.id === "w2")!;
  const curLevel = levelFromXp(st.user.xp);
  const deltaLevel = Math.max(0, curLevel - (st.user.weekStartLevel ?? curLevel));
  st.missions.progress[w2.id] = deltaLevel >= 1 ? 1 : 0;

  // w4: referrals real (no button)
  const w4 = MISSIONS.find((m) => m.id === "w4")!;
  st.missions.progress[w4.id] = st.user.referralsCount >= 1 ? 1 : 0;

  // w5: top 50 (computed)
  const w5 = MISSIONS.find((m) => m.id === "w5")!;
  st.missions.progress[w5.id] = computeRankPos(st) <= 50 ? 1 : 0;

  // w6: weekly mission completions count
  const w6 = MISSIONS.find((m) => m.id === "w6")!;
  st.missions.progress[w6.id] = Math.min(w6.target, st.user.weeklyMissionCompletions);

  // w7: only counts if NovaONE enabled (derived)
  const w7 = MISSIONS.find((m) => m.id === "w7")!;
  st.missions.progress[w7.id] = hasNovaOne ? Math.min(w7.target, st.user.weeklyMissionCompletions) : 0;

  // d3: streak is “tomorrow login”; we keep it derived but not completable same-day
  const d3 = MISSIONS.find((m) => m.id === "d3")!;
  st.missions.progress[d3.id] = 0; // stays 0 today; tomorrow login will count separately (later)
}

function tryComplete(st: AppState, m: Mission, hasNovaOne: boolean) {
  const p = st.missions.progress[m.id] ?? 0;
  const already = !!st.missions.completedAt[m.id];
  if (!already && p >= m.target) {
    const pts = awardPoints(st, m.rewardPts, hasNovaOne);
    st.missions.completedAt[m.id] = new Date().toISOString();
    if (m.type === "weekly") st.user.weeklyMissionCompletions += 1;
    return { completed: m, awardedPts: pts };
  }
  return { completed: null as Mission | null, awardedPts: 0 };
}

export function applyEvent(st: AppState, ev: AppEvent, hasNovaOne: boolean) {
  resetIfNeeded(st);

  // Base state updates (legit events only)
  if (ev.type === "LOGIN_TODAY") {
    st.user.lastLoginDate = ev.dateKey;
    if (!st.user.activeDaysThisWeek.includes(ev.dateKey)) st.user.activeDaysThisWeek.push(ev.dateKey);
    // Login gives XP? If you want, keep it tiny. For now: none.
  }

  if (ev.type === "PROFILE_COMPLETED") {
    // one-time XP reward could be here (optional)
    st.user.xp += 60;
  }

  if (ev.type === "REFERRAL_SIGNUP") {
    st.user.referralsCount += 1;
    st.user.xp += 60;
  }

  // Update leaderboard entry for me
  const me = st.leaderboard.find((x) => x.userId === st.user.id);
  if (me) me.xp = st.user.xp;

  // Event-driven missions only
  for (const m of MISSIONS.filter((x) => x.eventType === ev.type)) {
    st.missions.progress[m.id] = Math.min(m.target, (st.missions.progress[m.id] ?? 0) + 1);
    const out = tryComplete(st, m, hasNovaOne);
    if (out.completed) {
      recomputeDerived(st, hasNovaOne);
      saveState(st);
      return out;
    }
  }

  // Derived missions always recompute after any event
  recomputeDerived(st, hasNovaOne);

  // Try completing derived missions (they complete when conditions are true)
  for (const m of MISSIONS.filter((x) => x.derived)) {
    const out = tryComplete(st, m, hasNovaOne);
    if (out.completed) {
      recomputeDerived(st, hasNovaOne);
      saveState(st);
      return out;
    }
  }

  saveState(st);
  return { completed: null as Mission | null, awardedPts: 0 };
}