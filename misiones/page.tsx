"use client";

import { useEffect, useMemo, useState } from "react";
import { loadState, todayKey } from "@/lib/store";
import { applyEvent, computeRankPos, MISSIONS, type Mission } from "@/lib/missions";
import type { AppEvent } from "@/lib/events";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
type Toast = { id: string; title: string; body?: string };
function makeId() {
  return (globalThis.crypto?.randomUUID?.() ?? String(Math.random())).toString();
}

type Tab = "daily" | "weekly";

export default function MisionesPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [hasNovaOne, setHasNovaOne] = useState(false);

  // Start null to avoid hydration mismatch
  const [st, setSt] = useState<ReturnType<typeof loadState> | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(title: string, body?: string) {
    const id = makeId();
    setToasts((p) => [...p, { id, title, body }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2200);
  }

  // Load state + emit LOGIN_TODAY once (real within your app)
  useEffect(() => {
    const loaded = loadState();
    setSt(loaded);

    const ev: AppEvent = { type: "LOGIN_TODAY", dateKey: todayKey() };
    const out = applyEvent(loaded, ev, hasNovaOne);
    setSt({ ...loaded });

    if (out.completed) pushToast("Completado", `+${out.awardedPts} pts · ${out.completed.title}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const missions = MISSIONS;

  const daily = useMemo(() => missions.filter((m) => m.type === "daily"), [missions]);
  const weekly = useMemo(() => missions.filter((m) => m.type === "weekly"), [missions]);

  const me = st?.user;

  const level = useMemo(() => {
    const xp = me?.xp ?? 0;
    if (xp >= 30000) return 5;
    if (xp >= 15000) return 4;
    if (xp >= 7000) return 3;
    if (xp >= 3000) return 2;
    if (xp >= 1000) return 1;
    return 0;
  }, [me?.xp]);

  const rankPos = useMemo(() => (st ? computeRankPos(st) : 0), [st]);

  const dailyDone = useMemo(() => {
    if (!st) return 0;
    return daily.filter((m) => !!st.missions.completedAt[m.id]).length;
  }, [st, daily]);

  const weeklyGoal = 7;
  const weeklyDoneRaw = st?.user.weeklyMissionCompletions ?? 0;
  const weeklyDone = Math.min(weeklyDoneRaw, weeklyGoal);
  const weeklyPct = clamp((weeklyDone / weeklyGoal) * 100, 0, 100);

  const visible = tab === "daily" ? daily : weekly;

  function fire(ev: AppEvent) {
    if (!st) return;
    const out = applyEvent(st, ev, hasNovaOne);
    setSt({ ...st });

    if (out.completed) pushToast("Completado", `+${out.awardedPts} pts · ${out.completed.title}`);
    else pushToast("Actualizado", "Progreso guardado.");
  }

  function isDone(m: Mission) {
    if (!st) return false;
    return !!st.missions.completedAt[m.id];
  }

  function progressValue(m: Mission) {
    if (!st) return 0;
    return st.missions.progress[m.id] ?? 0;
  }

  /**
   * CORE RULES (no cheating):
   * - Derived missions: never clickable. They auto-complete when their condition becomes true.
   * - Only legit event missions are clickable:
   *   LOGIN_TODAY (reclaim), PROFILE_COMPLETED (go to /cuenta later), REFERRAL_SIGNUP (go to /cuenta or /referidos later)
   * - d3 (racha): no click. Validated by tomorrow login.
   */
  function handleAction(m: Mission) {
    if (!st) return;

    // streak mission cannot be forced
    if (m.id === "d3") {
      pushToast("Mañana", "Este reto se valida entrando mañana.");
      return;
    }

    // derived missions are automatic
    if ((m as any).derived) {
      pushToast("Automático", "Este reto se completa solo cuando se cumpla la condición.");
      return;
    }

    // event missions only
    const et = (m as any).eventType as AppEvent["type"] | undefined;
    if (!et) {
      pushToast("Automático", "Este reto no se completa por botón.");
      return;
    }

    if (et === "LOGIN_TODAY") {
      fire({ type: "LOGIN_TODAY", dateKey: todayKey() });
      return;
    }

    if (et === "PROFILE_COMPLETED") {
      // For now: route stub. Later /cuenta will actually trigger this.
      pushToast("Ir a Cuenta", "Esto se completará cuando termines tu perfil en /cuenta.");
      return;
    }

    if (et === "REFERRAL_SIGNUP") {
      // For now: route stub. Later /cuenta or /referidos will trigger this.
      pushToast("Ir a Referidos", "Se completará cuando alguien se registre con tu código.");
      return;
    }

    // Anything else should never be clickable
    pushToast("Automático", "Este reto no se completa por botón.");
  }

  function buttonLabel(m: Mission) {
    if (!st) return "…";
    if (isDone(m)) return "Hecho";
    if (m.id === "d3") return "Disponible mañana";

    if ((m as any).derived) return "Auto";

    const et = (m as any).eventType as string | undefined;
    if (et === "LOGIN_TODAY") return "Reclamar";
    if (et === "PROFILE_COMPLETED") return "Ir a Cuenta";
    if (et === "REFERRAL_SIGNUP") return "Ver referidos";
    return "Auto";
  }

  function disabled(m: Mission) {
    if (!st) return true;
    if (isDone(m)) return true;

    if (m.id === "d3") return true;

    // Derived missions: not clickable
    if ((m as any).derived) return true;

    // Only login mission is clickable right now
    const et = (m as any).eventType as string | undefined;
    if (et === "LOGIN_TODAY") return false;

    // profile/referral are navigational stubs for now
    return false;
  }

  function buttonStyle(m: Mission) {
    const done = isDone(m);
    const isDerived = !!(m as any).derived;
    const et = (m as any).eventType as string | undefined;

    if (!st) return "border border-white/10 bg-white/5 text-white/60 cursor-not-allowed";

    if (done) return "border border-white/10 bg-white/5 text-white/60 cursor-not-allowed";

    if (m.id === "d3" || isDerived) return "border border-white/10 bg-white/5 text-white/60 cursor-not-allowed";

    // login mission: primary
    if (et === "LOGIN_TODAY") return "bg-white text-black hover:bg-white/90";

    // profile/referral: secondary navigation
    return "border border-white/15 bg-white/5 hover:bg-white/10";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-140px] h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/5" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">NOVA</div>
              <div className="text-xs text-white/60">Retos</div>
            </div>
          </a>

          {/* Avoid hydration mismatch: show placeholders until loaded */}
          <div className="hidden items-center gap-2 md:flex">
            <Pill label="Nivel" value={st ? String(level) : "—"} />
            <Pill label="pts" value={st ? String(me?.points ?? 0) : "—"} />
            <Pill label="XP" value={st ? String(me?.xp ?? 0) : "—"} />
            <Pill label="Rank" value={st ? `#${rankPos}` : "—"} />
          </div>

          <button
            onClick={() => {
              setHasNovaOne((v) => !v);
              pushToast("NovaONE", !hasNovaOne ? "Boost activado (+20% pts en retos)" : "Boost desactivado");
              // derived mission w7 will recompute on next event; fine for now
            }}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
              hasNovaOne ? "bg-white text-black hover:bg-white/90" : "border border-white/15 bg-white/5 hover:bg-white/10"
            )}
          >
            {hasNovaOne ? "NovaONE: ON" : "NovaONE: OFF"}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        {/* Header counters */}
        <div className="mb-8 grid gap-3 md:grid-cols-3">
          <CounterCard title="Hoy" main={st ? `${dailyDone}/${daily.length}` : "—/—"} sub="Retos completados" />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs text-white/60">Semana</div>
            <div className="mt-1 text-2xl font-semibold">{st ? `${weeklyDone}/${weeklyGoal}` : "—/—"}</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white/60 transition-all duration-700" style={{ width: `${st ? weeklyPct : 0}%` }} />
            </div>
            <div className="mt-2 text-xs text-white/60">Objetivo semanal: 7</div>
          </div>

          <CounterCard title="NovaONE" main={hasNovaOne ? "Boost activo" : "Boost apagado"} sub="+20% puntos en retos" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("daily")}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              tab === "daily" ? "border-white/40 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            Diarias
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              tab === "weekly" ? "border-white/40 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            Semanales
          </button>

          <div className="ml-auto hidden text-xs text-white/60 md:block">Auto = se valida por sistema.</div>
        </div>

        {/* Missions */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visible.map((m) => {
            const isDerived = !!(m as any).derived;
            const done = isDone(m);
            const locked = m.id === "d3" || isDerived;

            return (
              <MissionCard
                key={m.id}
                m={m}
                value={progressValue(m)}
                done={done}
                locked={locked}
                lockText={m.id === "d3" ? "Mañana" : isDerived ? "Auto" : undefined}
                buttonLabel={buttonLabel(m)}
                disabled={disabled(m)}
                buttonClass={buttonStyle(m)}
                onClick={() => handleAction(m)}
              />
            );
          })}
        </div>
      </section>

      {/* Toasts */}
      <div className="fixed right-4 top-20 z-[60] w-[320px] max-w-[90vw] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-white/10 bg-black/75 backdrop-blur p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] animate-[pop_220ms_ease-out]"
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.body ? <div className="mt-1 text-xs text-white/70">{t.body}</div> : null}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes pop {
          from {
            transform: translateY(-6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      <span className="text-white font-semibold">{value}</span> {label}
    </span>
  );
}

function CounterCard({ title, main, sub }: { title: string; main: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{main}</div>
      <div className="mt-1 text-xs text-white/60">{sub}</div>
    </div>
  );
}

function MissionCard({
  m,
  value,
  done,
  locked,
  lockText,
  buttonLabel,
  disabled,
  buttonClass,
  onClick,
}: {
  m: Mission;
  value: number;
  done: boolean;
  locked?: boolean;
  lockText?: string;
  buttonLabel: string;
  disabled: boolean;
  buttonClass: string;
  onClick: () => void;
}) {
  const pct = useMemo(() => clamp((value / m.target) * 100, 0, 100), [value, m.target]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {m.title}
            {locked ? <span className="ml-2 text-xs text-white/50">· {lockText}</span> : null}
          </div>
          <div className="mt-1 text-xs text-white/60">{m.desc}</div>
        </div>
        <div className="shrink-0 text-xs text-white/70">+{m.rewardPts} pts</div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/60 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span>
          {Math.min(value, m.target)}/{m.target} {m.unit ?? ""}
        </span>
        <span className={done ? "text-white/80" : "text-white/60"}>{done ? "Completada" : "En progreso"}</span>
      </div>

      <button
        onClick={onClick}
        className={cn("mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99]", buttonClass)}
        disabled={disabled}
      >
        {buttonLabel}
      </button>
    </div>
  );
}