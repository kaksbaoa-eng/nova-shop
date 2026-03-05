"use client";

import { useEffect, useMemo, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function diffParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

export default function VipPage() {
  /**
   * GLOBAL countdown:
   * Cambia SOLO esta fecha si quieres otro launch global.
   * 60 días desde 2026-03-05T00:00:00Z => 2026-05-04T00:00:00Z
   */
  const VIP_LAUNCH_AT_ISO = "2026-05-04T00:00:00Z";
  const targetMs = useMemo(() => new Date(VIP_LAUNCH_AT_ISO).getTime(), [VIP_LAUNCH_AT_ISO]);

  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = targetMs - nowMs;
  const done = remainingMs <= 0;

  const { days, hours, minutes, seconds } = useMemo(() => diffParts(remainingMs), [remainingMs]);

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
              <div className="text-xs text-white/60">VIP</div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a className="hover:text-white" href="/misiones">Misiones</a>
            <a className="hover:text-white" href="/ranking">Ranking</a>
            <a className="hover:text-white" href="/vip">VIP</a>
            <a className="hover:text-white" href="/cuenta">Cuenta</a>
          </nav>

          <a
            href="/cuenta"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
          >
            Ver cuenta
          </a>
        </div>
      </header>

      {/* Center */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-5 py-14">
        <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              VIP Community · En proceso
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              {done ? "VIP desbloqueado" : "Acceso VIP en"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
              Este contador es global. Cuando llegue a cero, abrimos la comunidad y activamos perks.
            </p>

            {/* Countdown */}
            <div className="mt-10 w-full">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <TimeBlock label="Días" value={mounted ? String(days) : "—"} big />
                <TimeBlock label="Horas" value={mounted ? pad2(hours) : "—"} />
                <TimeBlock label="Min" value={mounted ? pad2(minutes) : "—"} />
                <TimeBlock label="Seg" value={mounted ? pad2(seconds) : "—"} />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
                  Launch: <span className="text-white/90 font-semibold">{VIP_LAUNCH_AT_ISO}</span>
                </span>

                <a
                  href="/cuenta"
                  className={cn(
                    "rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[0.99]",
                    "bg-white text-black hover:bg-white/90"
                  )}
                >
                  Preparar mi perfil
                </a>

                <a
                  href="/misiones"
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition active:scale-[0.99]"
                >
                  Hacer misiones
                </a>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
                Nota: en producción, esta fecha se deja fija (o viene de servidor) para que sea idéntica para todos.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TimeBlock({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-center">
      <div className={cn("font-semibold tracking-tight", big ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl")}>
        {value}
      </div>
      <div className="mt-2 text-xs text-white/60">{label}</div>
    </div>
  );
}