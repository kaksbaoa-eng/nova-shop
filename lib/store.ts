export type UserState = {
  id: string;
  name: string;
  avatarUrl?: string;

  points: number;
  xp: number;
  createdAt: string;

  lastLoginDate?: string;
  activeDaysThisWeek: string[];
  weeklyMissionCompletions: number;

  referralsCount: number;

  weekStartXp: number;
  weekStartLevel: number;

  accessoryId?: string; // reservado para luego
};

export type MissionsState = {
  progress: Record<string, number>;
  completedAt: Record<string, string | undefined>;
  dailyKey: string;
  weeklyKey: string;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  xp: number;
  avatarUrl?: string;
  accessoryId?: string;
};

export type AppState = {
  user: UserState;
  missions: MissionsState;
  leaderboard: LeaderboardEntry[];
};

// Cambiado para regenerar sin F12
const KEY = "nova_state_v2";

/* ----------------- date keys ----------------- */
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
}

/* ----------------- helpers ----------------- */
function levelFromXp(xp: number) {
  if (xp >= 30000) return 5;
  if (xp >= 15000) return 4;
  if (xp >= 7000) return 3;
  if (xp >= 3000) return 2;
  if (xp >= 1000) return 1;
  return 0;
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * Avatares "humanos" (sin thumbs/bottts/pixel-art/fun-emoji)
 * (10 estilos × 5 variantes = 50)
 */
export const AVATAR_STYLES = [
  "avataaars-neutral",
  "adventurer-neutral",
  "lorelei-neutral",
  "notionists-neutral",
  "personas",
  "open-peeps",
  "micah",
  "big-smile",
  "miniavs",
  "avataaars",
] as const;

export const AVATAR_VARIANTS = ["Prime", "Zen", "Luxe", "Nox", "Nova"] as const;

export function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/* Nombres más humanos */
const FIRST = [
  "Lucas","Mateo","Leo","Hugo","Daniel","Álvaro","Alejandro","Adrián","Mario","David",
  "Pablo","Enzo","Bruno","Sergio","Nico","Izan","Álex","Rafa","Iván","Marco",
  "Marta","Lucía","Paula","Sofía","Valeria","Carla","Noa","Sara","Emma","Alba",
  "Nerea","Claudia","Irene","Lola","Aitana","Vera","Inés","Elena","Julia","Mía"
];
const LAST = [
  "García","Rodríguez","López","Martínez","Sánchez","Pérez","Gómez","Díaz","Hernández","Muñoz",
  "Álvarez","Romero","Alonso","Gutiérrez","Navarro","Torres","Domínguez","Vázquez","Ramos","Gil",
  "Serrano","Molina","Blanco","Suárez","Ortega","Delgado","Castro","Rubio","Marín","Sanz"
];
const TAGS = ["prime","zen","neo","luxe","nox","spark","vanta","echo","blitz","nova","flow","pulse","drip"];

function makeHumanName() {
  const f = pick(FIRST);
  const l1 = pick(LAST);
  const l2 = pick(LAST);
  const useTwo = randInt(0, 100) < 28;
  const useTag = randInt(0, 100) < 35;
  const tag = pick(TAGS);
  const base = useTwo ? `${f} ${l1} ${l2}` : `${f} ${l1}`;
  return useTag ? `${base} · ${tag}` : base;
}

function makeBotAvatar(i: number, name: string) {
  const style = AVATAR_STYLES[i % AVATAR_STYLES.length];
  // semilla estable y “humana”
  const seed = `${name}-${i + 1}-${randInt(1000, 9999)}`;
  return dicebearUrl(style, seed);
}

function generateBots(count: number, topXp: number) {
  const bots: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    const t = (i + 1) / count;
    const curve = Math.pow(t, 2.15);

    let xp = Math.round(200 + curve * (topXp - 200));
    xp = Math.max(120, xp + randInt(-35, 35));

    const name = makeHumanName();

    bots.push({
      userId: `u_${String(i + 1).padStart(5, "0")}`, // sin “bot_”
      name,
      xp,
      avatarUrl: makeBotAvatar(i, name),
      accessoryId: undefined,
    });
  }

  // Top 1 “humano” (7 días misiones aprox)
  bots.sort((a, b) => b.xp - a.xp);
  bots[0].xp = topXp;
  bots.sort((a, b) => b.xp - a.xp);

  return bots;
}

/* ----------------- state load/save ----------------- */
export function loadState(): AppState {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const st = JSON.parse(raw) as AppState;

    // mini-migración: asegura que tu fila en leaderboard refleje tu usuario actual
    const me = st.leaderboard?.find((x) => x.userId === st.user.id);
    if (me) {
      me.name = st.user.name;
      me.xp = st.user.xp;
      me.avatarUrl = st.user.avatarUrl;
      me.accessoryId = st.user.accessoryId;
    }
    localStorage.setItem(KEY, JSON.stringify(st));
    return st;
  }

  const userId = crypto.randomUUID();
  const userName = "Jaime";

  // Avatar default “humano”
  const defaultAvatar = dicebearUrl("avataaars-neutral", `${userId}-Nova-avataaars-neutral`);

  const user: UserState = {
    id: userId,
    name: userName,
    avatarUrl: defaultAvatar,

    points: 120,
    xp: 850,
    createdAt: new Date().toISOString(),

    lastLoginDate: undefined,
    activeDaysThisWeek: [],
    weeklyMissionCompletions: 0,

    referralsCount: 0,

    weekStartXp: 850,
    weekStartLevel: levelFromXp(850),

    accessoryId: undefined,
  };

  const TOP_XP_7_DAYS = 1450;
  const bots = generateBots(296, TOP_XP_7_DAYS);

  const leaderboard: LeaderboardEntry[] = [
    { userId: user.id, name: user.name, xp: user.xp, avatarUrl: user.avatarUrl, accessoryId: user.accessoryId },
    ...bots,
  ];

  const st: AppState = {
    user,
    missions: {
      progress: {},
      completedAt: {},
      dailyKey: todayKey(),
      weeklyKey: weekKey(),
    },
    leaderboard,
  };

  localStorage.setItem(KEY, JSON.stringify(st));
  return st;
}

export function saveState(st: AppState) {
  localStorage.setItem(KEY, JSON.stringify(st));
}