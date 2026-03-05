"use client";

import { useEffect, useMemo, useState } from "react";
import { loadState, saveState } from "@/lib/store";
import { applyEvent } from "@/lib/missions";
import type { AppEvent } from "@/lib/events";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Toast = { id: string; title: string; body?: string };
function makeId() {
  return (globalThis.crypto?.randomUUID?.() ?? String(Math.random())).toString();
}

const AVATAR_STYLES = [
  "avataaars",
  "thumbs",
  "lorelei",
  "adventurer",
  "micah",
  "fun-emoji",
  "big-smile",
  "notionists",
  "pixel-art",
  "bottts",
] as const;

const AVATAR_VARIANTS = ["Prime", "Zen", "Luxe", "Nox", "Nova"] as const; // 5 × 10 = 50

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export default function CuentaPage() {
  const [st, setSt] = useState<ReturnType<typeof loadState> | null>(null);

  const [name, setName] = useState("");

  // Avatar selection (dropdown)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatarKey, setSelectedAvatarKey] = useState("");

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(title: string, body?: string) {
    const id = makeId();
    setToasts((p) => [...p, { id, title, body }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2200);
  }

  useEffect(() => {
    const s = loadState();
    setSt({ ...s });

    setName(s.user.name ?? "");
    setAvatarUrl(s.user.avatarUrl ?? "");

    // try to infer selected key by matching url
    setSelectedAvatarKey("");
  }, []);

  const avatarOptions = useMemo(() => {
    if (!st) return [];
    const base = st.user.id.slice(0, 8);
    const opts: Array<{ key: string; label: string; url: string }> = [];

    for (const style of AVATAR_STYLES) {
      for (const v of AVATAR_VARIANTS) {
        const key = `${style}-${v}`;
        const seed = `${base}-${v}-${style}`;
        opts.push({
          key,
          label: `${style} · ${v}`,
          url: dicebearUrl(style, seed),
        });
      }
    }
    return opts;
  }, [st]);

  useEffect(() => {
    if (!st) return;
    if (!avatarUrl) return;

    // If current avatar matches one option, set selectedAvatarKey
    const match = avatarOptions.find((o) => o.url === avatarUrl);
    if (match) setSelectedAvatarKey(match.key);
  }, [st, avatarOptions, avatarUrl]);

  const profileComplete = useMemo(() => {
    return name.trim().length >= 2 && avatarUrl.trim().length > 10;
  }, [name, avatarUrl]);

  function onSelectAvatar(key: string) {
    setSelectedAvatarKey(key);
    const opt = avatarOptions.find((o) => o.key === key);
    if (opt) setAvatarUrl(opt.url);
  }

  function onSave() {
    if (!st) return;

    const n = name.trim();
    if (n.length < 2) {
      pushToast("Falta algo", "Pon un nombre válido (mínimo 2 letras).");
      return;
    }
    if (!avatarUrl || avatarUrl.trim().length < 10) {
      pushToast("Falta algo", "Selecciona un avatar.");
      return;
    }

    // Update user
    st.user.name = n;
    st.user.avatarUrl = avatarUrl.trim();
    st.user.countryCode = countryCode;

    // Update my leaderboard row too (so ranking shows instantly)
    const me = st.leaderboard.find((x) => x.userId === st.user.id);
    if (me) {
      me.name = st.user.name;
      me.avatarUrl = st.user.avatarUrl;
      me.countryCode = st.user.countryCode;
      me.accessoryId = st.user.accessoryId;
    }

    saveState(st);
    setSt({ ...st });
    pushToast("Guardado", "Perfil actualizado.");

    // Trigger PROFILE_COMPLETED only if mission not completed yet (no farm)
    if (profileComplete && !st.missions.completedAt?.["d2"]) {
      const ev: AppEvent = { type: "PROFILE_COMPLETED" };
      const out = applyEvent(st, ev, false);
      saveState(st);
      setSt({ ...st });
      if (out.completed) pushToast("Reto completado", `${out.completed.title} (+${out.awardedPts} pts)`);
    }
  }

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
              <div className="text-xs text-white/60">Cuenta</div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a className="hover:text-white" href="/misiones">Misiones</a>
            <a className="hover:text-white" href="/ranking">Ranking</a>
            <a className="hover:text-white" href="/vip">VIP</a>
            <a className="hover:text-white" href="/cuenta">Cuenta</a>
          </nav>

          <a
            href="/ranking"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
          >
            Ver ranking
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Tu perfil</div>
                <div className="mt-1 text-xs text-white/60">Avatar + país se reflejan en el ranking.</div>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  profileComplete ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/60"
                )}
              >
                {profileComplete ? "Completo" : "Incompleto"}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-white/40">Avatar</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white/60">Vista previa</div>
                <div className="mt-1 text-xl font-semibold truncate">{name || "Sin nombre"}</div>
                <div className="mt-1 text-xs text-white/60">País: {countryCode}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-xs text-white/60">Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre…"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">País</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                >
                  <option value="ES">ES (España)</option>
                  <option value="FR">FR (Francia)</option>
                  <option value="PT">PT</option>
                  <option value="IT">IT</option>
                  <option value="DE">DE</option>
                  <option value="NL">NL</option>
                  <option value="BE">BE</option>
                  <option value="SE">SE</option>
                  <option value="NO">NO</option>
                  <option value="DK">DK</option>
                  <option value="CH">CH</option>
                  <option value="AT">AT</option>
                  <option value="IE">IE</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Seleccionar avatar</label>
                <select
                  value={selectedAvatarKey}
                  onChange={(e) => onSelectAvatar(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                >
                  <option value="">— Elige uno (50) —</option>
                  {avatarOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <div className="mt-3 grid grid-cols-5 gap-2">
                  {avatarOptions.slice(0, 10).map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => onSelectAvatar(o.key)}
                      className={cn(
                        "rounded-2xl border bg-white/5 p-2 transition hover:bg-white/10",
                        selectedAvatarKey === o.key ? "border-white/40" : "border-white/10"
                      )}
                      title={o.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.url} alt="" className="h-10 w-10" />
                    </button>
                  ))}
                </div>

                <div className="mt-2 text-[11px] text-white/45">
                  Arriba tienes un “quick pick” (10). En el desplegable están los 50.
                </div>
              </div>

              <button
                onClick={onSave}
                className="mt-2 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.99] transition"
              >
                Guardar perfil
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold">Estado</div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Stat label="Puntos" value={st ? String(st.user.points) : "—"} />
                <Stat label="XP" value={st ? String(st.user.xp) : "—"} />
                <Stat label="País" value={countryCode} />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
                Tip: guarda perfil → ve a /ranking y se actualiza tu fila.
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold">Accesorios (próximo)</div>
              <div className="mt-2 text-xs text-white/60">
                Vamos a meter 100 accesorios como overlay real (A001–A100) y se verán en ranking.
              </div>
            </div>
          </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}