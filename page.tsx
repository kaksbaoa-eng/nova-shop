"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function Home() {
  // Placeholder user (luego: cuenta real)
  const user = {
    name: "Jaime",
    avatarUrl: "https://api.dicebear.com/7.x/thumbs/svg?seed=Jaime",
    rankPos: 124,
    points: 120,
    xp: 850,
    level: 1,
    referrals: 3,
  };

  // Discreto
  const passCost = 900;

  // NovaONE
  const [novaOpen, setNovaOpen] = useState(false);

  // Floating widget close
  const [showFloatingNova, setShowFloatingNova] = useState(true);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const passPct = useMemo(() => clamp((user.points / passCost) * 100, 0, 100), [user.points]);

  function pushToast(title: string, body?: string) {
    const id = makeId();
    setToasts((p) => [...p, { id, title, body }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2200);
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      pushToast("Listo.", "Tu perfil está listo para subir de nivel.");
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-140px] h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/5" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">NOVA</div>
              <div className="text-xs text-white/60">NovaONE</div>
            </div>
          </div>

          {/* Navbar future sections */}
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a className="hover:text-white" href="/catalogo">
              Catálogo
            </a>
            <a className="hover:text-white" href="/misiones">
              Misiones
            </a>
            <a className="hover:text-white" href="/ranking">
              Ranking
            </a>
            <a className="hover:text-white" href="/vip">
              VIP
            </a>
            <a className="hover:text-white" href="/cuenta">
              Cuenta
            </a>
          </nav>

          <button
            onClick={() => setNovaOpen(true)}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] transition"
          >
            Ver NovaONE
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left: hero + locked VIP */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Cuenta · Rangos · Perks
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Tu cuenta es el juego.
              <span className="block text-white/60">NovaONE es el upgrade.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm text-white/70">
              Progreso visible. Status. Ventajas. Todo lo importante, sin ruido.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setNovaOpen(true);
                  pushToast("NovaONE", "Abriendo perks VIP…");
                }}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] transition"
              >
                Activar NovaONE
              </button>

              <button
                onClick={() => pushToast("Cuenta", "Próximo: dashboard completo con referidos y ranking.")}
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Ver mi perfil
              </button>
            </div>

            {/* VIP community locked (no 0/100) */}
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">VIP Community</div>
                  <div className="mt-1 text-xs text-white/60">Bloqueado. Acceso cuando se active el unlock.</div>
                </div>

                <div className="grid place-items-center rounded-2xl border border-white/10 bg-black/30 p-3">
                  {/* Lock icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="opacity-80">
                    <path
                      d="M7 11V8.5C7 6.01472 9.01472 4 11.5 4C13.9853 4 16 6.01472 16 8.5V11"
                      stroke="white"
                      strokeOpacity="0.8"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6.5 11H16.5C17.6046 11 18.5 11.8954 18.5 13V18C18.5 19.1046 17.6046 20 16.5 20H6.5C5.39543 20 4.5 19.1046 4.5 18V13C4.5 11.8954 5.39543 11 6.5 11Z"
                      stroke="white"
                      strokeOpacity="0.8"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[12%] rounded-full bg-white/30" />
              </div>

              <div className="mt-3 text-xs text-white/50">NovaONE tendrá prioridad cuando se desbloquee.</div>
            </div>
          </div>

          {/* Right: profile widget + NovaONE card */}
          <div className="space-y-4">
            {/* Profile widget */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-14 w-14 rounded-2xl border border-white/15 bg-white/5"
                />
                <div className="min-w-0">
                  <div className="text-lg font-semibold leading-tight">{user.name}</div>
                  <div className="text-xs text-white/60">
                    Nivel <span className="text-white font-semibold">{user.level}</span> · Ranking{" "}
                    <span className="text-white font-semibold">#{user.rankPos}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat label="Puntos" value={user.points} />
                <Stat label="XP" value={user.xp} />
                <Stat label="Referidos" value={user.referrals} />
              </div>

              {/* Pass minimized */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">Pass 31D</div>
                  <div className="text-xs text-white/70">
                    <span className="text-white font-semibold">{user.points}</span>/{passCost}
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white/50 transition-all duration-700"
                    style={{ width: `${passPct}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => setNovaOpen(true)}
                className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] transition"
              >
                Upgrade a NovaONE
              </button>
            </div>

            <NovaOneCard onOpen={() => setNovaOpen(true)} />
          </div>
        </div>
      </section>

      {/* Floating NovaONE widget with close X */}
      {showFloatingNova ? (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-[65] w-[270px] max-w-[88vw]",
            "rounded-3xl border border-white/10 bg-black/70 backdrop-blur",
            "p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
            "animate-[floaty_4.2s_ease-in-out_infinite]"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => setNovaOpen(true)}
              className="min-w-0 text-left"
              aria-label="Abrir NovaONE"
            >
              <div className="text-sm font-semibold">NovaONE</div>
              <div className="mt-1 text-xs text-white/60">Perks VIP. Progreso más rápido.</div>
            </button>

            <button
              onClick={() => setShowFloatingNova(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
              aria-label="Cerrar widget"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <button
            onClick={() => setNovaOpen(true)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
          >
            Ver beneficios →
          </button>

          <div className="mt-3 grid gap-2 text-xs text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              Envío premium <span className="text-white/60">· envíos más rápidos</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">Regalos y drops</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">Descuentos VIP</div>
          </div>

          <div className="mt-3 text-xs font-semibold text-white">Abrir NovaONE →</div>
        </div>
      ) : null}

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

      {/* NovaONE Modal */}
      {novaOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setNovaOpen(false)} />
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-black/85 backdrop-blur p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Plan NovaONE</div>
                <div className="mt-1 text-xs text-white/60">Status + ventajas. Sin ruido.</div>
              </div>
              <button
                onClick={() => setNovaOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Perk title="Envío premium" body="Envíos más rápidos" />
              <Perk title="Regalos y drops" />
              <Perk title="Descuentos VIP" />
              <Perk title="Prioridad VIP" />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Tu perfil</div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <Stat label="Nivel" value={user.level} />
                <Stat label="Puntos" value={user.points} />
                <Stat label="Ranking" value={`#${user.rankPos}`} />
              </div>
              <div className="mt-3 text-xs text-white/60">
                NovaONE acelera el progreso y te da prioridad cuando el sistema se active.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => pushToast("NovaONE", "Solicitud guardada (hoy solo UI).")}
                className="flex-1 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] transition"
              >
                Quiero NovaONE
              </button>
              <button
                onClick={() => setNovaOpen(false)}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Ahora no
              </button>
            </div>

            <div className="mt-4 text-[11px] text-white/45">
              Siguiente paso: cuenta real + ranking + referidos + panel interno.
            </div>
          </div>
        </div>
      ) : null}

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
        @keyframes floaty {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0);
          }
        }
        @keyframes shine {
          0% {
            transform: translateX(-20px) rotate(12deg);
            opacity: 0.2;
          }
          50% {
            transform: translateX(420px) rotate(12deg);
            opacity: 0.35;
          }
          100% {
            transform: translateX(-20px) rotate(12deg);
            opacity: 0.2;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function Perk({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">{title}</div>
      {body ? <div className="mt-1 text-xs text-white/60">{body}</div> : null}
    </div>
  );
}

function NovaOneCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="pointer-events-none absolute -left-24 top-0 h-full w-40 rotate-12 bg-white/10 blur-2xl animate-[shine_2.8s_ease-in-out_infinite]" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Plan NovaONE</div>
          <div className="mt-1 text-xs text-white/60">Perks VIP. Status. Ventajas.</div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white">
          VIP
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-white/70">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span>Envío premium</span>
          <span className="text-xs text-white/60">envíos más rápidos</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Regalos y drops</div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Descuentos VIP</div>
      </div>

      <button
        onClick={onOpen}
        className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] transition"
      >
        Ver NovaONE
      </button>
    </div>
  );
}