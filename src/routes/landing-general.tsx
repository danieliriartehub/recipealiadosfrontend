import { createFileRoute, Link } from "@tanstack/react-router";
import { Recycle, ExternalLink, ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/landing-general")({
  head: () => ({
    meta: [
      { title: "Recipe — Ecosistema completo" },
      {
        name: "description",
        content:
          "Accede a la app de usuarios Recipe, al portal de aliados y descarga nuestras aplicaciones móviles.",
      },
    ],
  }),
  component: LandingGeneral,
});

// ─── Datos de plataformas ──────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "recipe-users",
    emoji: "♻️",
    tag: "App Usuarios",
    name: "Recipe",
    description:
      "La app para que estudiantes, docentes y staff de USIL reciclen, acumulen puntos y canjeen recompensas eco.",
    url: "https://recipefrontend-phi.vercel.app/",
    color: "from-emerald-500 to-teal-600",
    bgSoft: "bg-emerald-50 border-emerald-200",
    tagColor: "bg-emerald-100 text-emerald-700",
    ctaLabel: "Ir a la plataforma",
    appStoreAvailable: false,
    playStoreAvailable: false,
  },
  {
    id: "recipe-aliados",
    emoji: "🤝",
    tag: "Portal Aliados",
    name: "Recipe Aliados",
    description:
      "El portal para que empresas aliadas gestionen sus productos, configuren su marca y lleguen a la comunidad USIL.",
    url: "https://recipealiadosfrontend.vercel.app/",
    color: "from-blue-500 to-indigo-600",
    bgSoft: "bg-blue-50 border-blue-200",
    tagColor: "bg-blue-100 text-blue-700",
    ctaLabel: "Ir al portal",
    appStoreAvailable: false,
    playStoreAvailable: false,
  },
];

// ─── Componente principal ──────────────────────────────────────────────────────
function LandingGeneral() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>
              Recipe{" "}
              <span className="font-normal text-muted-foreground">
                Ecosistema
              </span>
            </span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-16 md:py-24"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            <Recycle className="h-3.5 w-3.5" />
            Plataformas oficiales USIL · Recipe
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Todo el ecosistema{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Recipe
            </span>{" "}
            en un lugar
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Encuentra la plataforma que necesitas: la app para reciclar y ganar
            puntos, o el portal para gestionar tu negocio aliado.
          </p>
        </div>
      </section>

      {/* ── Plataformas ── */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {PLATFORMS.map((p) => (
            <PlatformCard key={p.id} platform={p} />
          ))}
        </div>
      </section>

      {/* ── Coming soon banner ── */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-3xl border border-accent/30 bg-accent/10 p-8 text-center">
          <Smartphone className="mx-auto mb-3 h-10 w-10 text-accent-foreground/70" />
          <h2 className="text-xl font-bold">Apps móviles próximamente</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Estamos preparando nuestras apps nativas para iOS y Android. Cuando
            estén disponibles, encontrarás los enlaces de descarga directamente
            en cada tarjeta.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <AppBadge store="appstore" available={false} />
            <AppBadge store="playstore" available={false} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Recipe · Universidad San Ignacio de Loyola</span>
          <span>USIL Sostenible · Ecosistema Recipe</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Tarjeta de plataforma ─────────────────────────────────────────────────────
function PlatformCard({
  platform,
}: {
  platform: (typeof PLATFORMS)[number];
}) {
  return (
    <div
      className={`flex flex-col rounded-3xl border p-7 shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-1 ${platform.bgSoft} bg-white`}
    >
      {/* Header */}
      <div className="mb-5 flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${platform.color} text-3xl shadow-md`}
        >
          {platform.emoji}
        </div>
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${platform.tagColor}`}
          >
            {platform.tag}
          </span>
          <h2 className="mt-1 text-2xl font-bold">{platform.name}</h2>
        </div>
      </div>

      {/* Description */}
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
        {platform.description}
      </p>

      {/* CTA Web */}
      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6"
      >
        <Button
          className={`w-full gap-2 bg-gradient-to-r ${platform.color} text-white shadow-md hover:opacity-90`}
        >
          {platform.ctaLabel}
          <ExternalLink className="h-4 w-4" />
        </Button>
      </a>

      {/* App download icons */}
      <div className="mt-4 flex gap-3">
        <AppBadge store="appstore" available={platform.appStoreAvailable} compact />
        <AppBadge store="playstore" available={platform.playStoreAvailable} compact />
      </div>
    </div>
  );
}

// ─── Badge descarga app ────────────────────────────────────────────────────────
function AppBadge({
  store,
  available,
  compact = false,
}: {
  store: "appstore" | "playstore";
  available: boolean;
  compact?: boolean;
}) {
  const isAppStore = store === "appstore";

  const content = (
    <div
      className={`flex items-center gap-2 rounded-xl border ${
        available
          ? "border-foreground/20 bg-foreground text-background"
          : "border-border bg-muted/60 text-muted-foreground"
      } ${compact ? "px-3 py-2" : "px-5 py-3"} transition-opacity`}
    >
      {/* Icon SVG */}
      {isAppStore ? (
        <svg
          viewBox="0 0 24 24"
          className={`${compact ? "h-5 w-5" : "h-6 w-6"} shrink-0 fill-current`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className={`${compact ? "h-5 w-5" : "h-6 w-6"} shrink-0 fill-current`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3.18 23.76c.3.17.64.22.99.13l12.5-7.18-2.61-2.61-10.88 9.66zm-1.8-20.3C1.14 3.83 1 4.22 1 4.69v14.62c0 .47.14.86.38 1.16l.06.06L8.93 13v-.18L1.44 5.4l-.06.06zm18.54 9.27l-2.56-1.47-2.89 2.89 2.89 2.89 2.58-1.48c.74-.42.74-1.41-.02-1.83zM4.17.24L16.67 7.4l-2.61 2.61L3.18.35C3.52.26 3.87.32 4.17.24z" />
        </svg>
      )}

      {!compact && (
        <div className="text-left">
          <div className="text-[10px] leading-none opacity-70">
            {available
              ? isAppStore
                ? "Download on the"
                : "Get it on"
              : "Próximamente"}
          </div>
          <div className="text-sm font-semibold leading-tight">
            {isAppStore ? "App Store" : "Google Play"}
          </div>
        </div>
      )}

      {compact && (
        <span className="text-xs font-medium">
          {isAppStore ? "App Store" : "Google Play"}
        </span>
      )}
    </div>
  );

  if (!available) {
    return (
      <div className="relative cursor-not-allowed flex-1" title="Próximamente">
        <div className="opacity-50">{content}</div>
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-accent-foreground whitespace-nowrap">
          Próximo
        </span>
      </div>
    );
  }

  return <div className="flex-1">{content}</div>;
}
