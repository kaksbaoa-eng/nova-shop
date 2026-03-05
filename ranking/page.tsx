"use client";

import { useEffect, useMemo, useState } from "react";
import { loadState } from "@/lib/store";
import { computeRankPos } from "@/lib/missions";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Row = {
  pos: number;
  userId: string;
  name: string;
  xp: number;
  avatarUrl?: string;
  accessoryId?: string;
  isMe: boolean;
};

function levelFromXp(xp: number) {
  if (xp >= 30000) return 5;
  if (xp >= 15000) return 4;
  if (xp >= 7000) return 3;
  if (xp >= 3000) return 2;
  if (xp >= 1000) return 1;
  return 0;
}

export default function RankingPage() {
  const [st, setSt] = useState<ReturnType<typeof loadState> | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const s = loadState();
    setSt({ ...s });
  }, []);

  const rows: Row[] = useMemo(() => {
    if (!st) return [];
    const meId = st.user.id;
    const sorted = [...st.leaderboard].sort((a, b) => b.xp - a.xp);

    return sorted.map((u, idx) => ({
      pos: idx + 1,
      userId: u.userId,
      name: u.name,
      xp: u.xp,
      avatarUrl: u.avatarUrl,
      accessoryId: u.accessoryId,
      isMe: u.userId === meId,
    }));
  }, [st]);

  const myPos = useMemo(() => (st ? computeRankPos(st) : 0), [st]);
  const myRow = rows.find((r) => r.isMe);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const top = filtered.slice(0, 50);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-140px] h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/5" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">NOVA</div>
              <div className="text-xs text-white/60">Ranking</div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a className="hover:text-white" href="/misiones">Misiones</a>
            <a className="hover:text-white" href="/ranking">Ranking</a>
            <a className="hover:text-white" href="/vip">VIP</a>
            <a className="hover:text-white" href="/cuenta">Cuenta</a>
          </nav>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Tu posición: <span className="text-white font-semibold">{st ? `#${myPos}` : "—"}</span>
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Ranking</h1>
            <p className="mt-2 text-sm text-white/60">Clasificación por XP (Top 50).</p>
          </div>

          <div className="w-full max-w-md">
            <label className="text-xs text-white/60">Buscar usuario</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe un nombre…"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
            />
          </div>
        </div>

        <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Tu estado</div>
              <div className="mt-1 text-xs text-white/60">Tu perfil se refleja aquí.</div>
            </div>
            <div className="flex items-center gap-2">
              <Chip label="Posición" value={st ? `#${myPos}` : "—"} />
              <Chip label="XP" value={st ? String(st.user.xp) : "—"} />
              <Chip label="Usuarios" value={st ? String(rows.length) : "—"} />
            </div>
          </div>

          {myRow ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <Avatar avatarUrl={myRow.avatarUrl} accessoryId={myRow.accessoryId} />
              <div className="min-w-0">
                <div className="font-semibold">{myRow.name}</div>
                <div className="text-xs text-white/60">
                  Nivel <span className="text-white/80">{levelFromXp(myRow.xp)}</span> · XP{" "}
                  <span className="text-white font-semibold">{myRow.xp}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-white/60">Cargando…</div>
          )}
        </div>

        <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-sm font-semibold">Top 50</div>
            <div className="text-xs text-white/60">{st ? `${rows.length} usuarios` : "—"}</div>
          </div>

          <div className="border-t border-white/10" />

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-black/40 backdrop-blur">
                <tr className="text-xs text-white/60">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3 text-right">XP</th>
                </tr>
              </thead>

              <tbody>
                {top.map((r) => (
                  <tr
                    key={r.userId}
                    className={cn("border-t border-white/10 text-sm", r.isMe ? "bg-white/10" : "hover:bg-white/5")}
                  >
                    <td className="px-6 py-4">{medal(r.pos)}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar avatarUrl={r.avatarUrl} accessoryId={r.accessoryId} />
                        <div className="min-w-0">
                          <div className="font-semibold">
                            {r.name} {r.isMe ? <span className="text-xs text-white/60">(tú)</span> : null}
                          </div>
                          <div className="text-xs text-white/60">Nivel {levelFromXp(r.xp)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-semibold">{r.xp}</td>
                  </tr>
                ))}

                {!st ? (
                  <tr className="border-t border-white/10">
                    <td className="px-6 py-6 text-xs text-white/60" colSpan={3}>
                      Cargando ranking…
                    </td>
                  </tr>
                ) : top.length === 0 ? (
                  <tr className="border-t border-white/10">
                    <td className="px-6 py-6 text-xs text-white/60" colSpan={3}>
                      No hay resultados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {label}: <span className="text-white font-semibold">{value}</span>
    </span>
  );
}

function medal(pos: number) {
  if (pos === 1) return <span className="font-semibold">🥇 1</span>;
  if (pos === 2) return <span className="font-semibold">🥈 2</span>;
  if (pos === 3) return <span className="font-semibold">🥉 3</span>;
  return <span className="text-white/70">{pos}</span>;
}

function Avatar({ avatarUrl, accessoryId }: { avatarUrl?: string; accessoryId?: string }) {
  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : null}

      {accessoryId ? (
        <div className="absolute -right-1 -top-1 rounded-full border border-white/20 bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
          {accessoryId}
        </div>
      ) : null}
    </div>
  );
}