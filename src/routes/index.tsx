import { createFileRoute, Link } from "@tanstack/react-router";
import { Recycle, ExternalLink, ArrowLeft, Leaf, MapPin, QrCode, Gift, Smartphone, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recipe — Recicla en USIL y obtén recompensas" },
      {
        name: "description",
        content:
          "Convierte tus residuos reciclables en beneficios académicos, descuentos exclusivos y acciones que ayudan a construir un campus más sostenible.",
      },
    ],
  }),
  component: LandingGeneral,
});

// ─── Datos ────────────────────────────────────────────────────────
const PASOS = [
  { icon: Recycle, title: "Separa materiales", desc: "Plástico, papel, cartón, vidrio o aluminio." },
  { icon: MapPin, title: "Acude a un centro", desc: "Visita uno de nuestros acopios en Campus 1 o 2." },
  { icon: QrCode, title: "Presenta tu QR", desc: "Muestra tu código personal desde la app." },
  { icon: CheckCircle2, title: "Operador registra", desc: "Validamos la cantidad de material entregado." },
  { icon: TrendingUp, title: "Suma EcoPuntos", desc: "RECIPE acredita tus puntos automáticamente." },
  { icon: Gift, title: "Canjea recompensas", desc: "Disfruta de beneficios académicos y descuentos." },
];

const BENEFICIOS = [
  {
    category: "Beneficios Académicos",
    items: ["Horas académicas validadas", "Participación en actividades institucionales", "Reconocimientos ambientales"],
    color: "from-emerald-500 to-emerald-700",
    bg: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    category: "Beneficios Comerciales",
    items: ["Descuentos en restaurantes", "Promociones en cafeterías", "Cupones de empresas aliadas"],
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    textColor: "text-blue-700",
  },
];

const PLATFORMS = [
  {
    id: "recipe-users",
    emoji: "📱",
    tag: "Para Estudiantes",
    name: "App RECIPE",
    description: "La app principal para ubicar centros, registrar tu reciclaje con QR y canjear tus recompensas.",
    webUrl: "https://recipefrontend-phi.vercel.app/",
    apkUrl: "https://github.com/danteleilahub/recipefrontend/releases/download/App/app-release.apk", // Enlace de descarga (puede actualizarse luego)
    color: "from-emerald-500 to-teal-600",
    bgSoft: "bg-emerald-50/50 border-emerald-200",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "recipe-aliados",
    emoji: "🤝",
    tag: "Para Empresas y USIL",
    name: "Portal Aliados",
    description: "Gestiona tu marca, valida entregas y ofrece productos al catálogo de recompensas de la comunidad USIL.",
    webUrl: "/landing-aliados",
    apkUrl: "https://github.com/danteleilahub/recipealiadosfrontend/releases/download/App/app-release.apk",
    color: "from-blue-500 to-indigo-600",
    bgSoft: "bg-blue-50/50 border-blue-200",
    tagColor: "bg-blue-100 text-blue-700",
  },
];

// ─── Componente principal ──────────────────────────────────────────────────────
function LandingGeneral() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-sm">
              <Recycle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg tracking-tight">
              RECIPE
            </span>
          </Link>
          {/* <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </Link> */}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 md:pt-32 lg:pb-32">
        <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[100px] opacity-50" />
        <div className="absolute right-0 top-1/2 -z-10 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-500/10 blur-[80px]" />
        
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-emerald-200 bg-emerald-50/50 px-4 py-1.5 shadow-sm backdrop-blur">
            <Leaf className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">Iniciativa Sostenible USIL</p>
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            Recicla dentro de la USIL. <br className="hidden md:block" />
            Obtén recompensas. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Genera impacto.
            </span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Convierte tus residuos reciclables en beneficios académicos, descuentos exclusivos y acciones que ayudan a construir un campus más sostenible.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#descargas">
              <Button size="lg" className="h-14 rounded-full px-8 text-base shadow-lg transition-transform hover:scale-105 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400">
                Comienza a reciclar hoy
              </Button>
            </a>
            <a href="#recompensas">
              <Button size="lg" variant="outline" className="h-14 rounded-full border-2 px-8 text-base hover:bg-muted/50">
                Conoce tus beneficios
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Qué es Recipe / Problema / Solución ── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              ¿Por qué nace RECIPE?
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Muchos estudiantes desean contribuir al cuidado del medio ambiente, pero no participan activamente debido a la falta de incentivos concretos, el desconocimiento de los puntos de reciclaje y procesos poco atractivos para los jóvenes.
              </p>
              <p className="font-medium text-foreground">
                Como resultado, una gran cantidad de residuos reciclables termina siendo descartada de manera incorrecta.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-8 shadow-sm">
            <h3 className="mb-4 text-2xl font-bold text-emerald-950">Nuestra Solución</h3>
            <p className="mb-6 text-emerald-800/80">
              RECIPE transforma el reciclaje en una <strong>experiencia simple, digital y recompensada</strong>.
            </p>
            <ul className="space-y-4">
              {[
                "Ubica centros de acopio dentro de la USIL.",
                "Registra entregas con tu código QR personal.",
                "Acumula EcoPuntos por cada material.",
                "Visualiza el impacto ambiental generado."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 rounded-full bg-emerald-200/50 p-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">¿Cómo funciona?</h2>
            <p className="mt-4 text-muted-foreground">El proceso de reciclaje nunca fue tan fácil y transparente.</p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PASOS.map((paso, index) => (
              <div key={index} className="relative rounded-2xl bg-background p-6 shadow-sm transition-shadow hover:shadow-md border border-border/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <paso.icon className="h-6 w-6" />
                </div>
                <div className="absolute right-6 top-6 text-4xl font-black text-muted/30 select-none">
                  {index + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold">{paso.title}</h3>
                <p className="text-sm text-muted-foreground">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Centros de Acopio ── */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Centros de Acopio Autorizados</h2>
          <p className="mt-4 text-muted-foreground">Encuentra los puntos oficiales dentro del campus USIL.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {[1, 2].map((num) => (
            <div key={num} className="flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Campus {num} USIL</h3>
                <p className="text-sm text-muted-foreground mt-1">Punto autorizado para recepción y validación de materiales reciclables.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recompensas ── */}
      <section id="recompensas" className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-background to-background" />
        
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              <Gift className="h-4 w-4" />
              Sistema de Recompensas
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Gana EcoPuntos por reciclar</h2>
            <p className="mt-4 text-muted-foreground">Tus buenas acciones tienen un retorno directo para ti.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {BENEFICIOS.map((ben, idx) => (
              <div key={idx} className={`overflow-hidden rounded-3xl border border-transparent bg-background shadow-lg`}>
                <div className={`h-2 w-full bg-gradient-to-r ${ben.color}`} />
                <div className="p-8">
                  <h3 className={`mb-6 text-2xl font-bold ${ben.textColor}`}>{ben.category}</h3>
                  <ul className="space-y-4">
                    {ben.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ben.bg}`}>
                          <CheckCircle2 className={`h-4 w-4 ${ben.textColor}`} />
                        </div>
                        <span className="font-medium text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plataformas / Descargas ── */}
      <section id="descargas" className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Comienza ahora</h2>
          <p className="mt-4 text-muted-foreground">Accede desde la web o descarga la aplicación móvil.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {PLATFORMS.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-3xl border p-8 shadow-sm transition-transform hover:-translate-y-1 ${p.bgSoft} bg-white`}>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${p.color} text-3xl shadow-md`}>
                    {p.emoji}
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${p.tagColor}`}>
                      {p.tag}
                    </span>
                    <h3 className="mt-1 text-2xl font-bold">{p.name}</h3>
                  </div>
                </div>
              </div>
              
              <p className="mb-8 flex-1 text-muted-foreground leading-relaxed">
                {p.description}
              </p>

              <div className="space-y-4">
                {/* Botón Web */}
                <a href={p.webUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className={`w-full gap-2 h-12 bg-gradient-to-r ${p.color} text-white shadow-md hover:opacity-90`}>
                    <ExternalLink className="h-4 w-4" />
                    Acceder vía Web
                  </Button>
                </a>
                
                {/* Botones App */}
                {p.apkUrl && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a href={p.apkUrl} className="block">
                      <Button variant="outline" className="w-full gap-2 h-12 bg-white hover:bg-muted text-emerald-700 border-emerald-200">
                        <Smartphone className="h-4 w-4" />
                        Descargar APK
                      </Button>
                    </a>
                    <div className="relative flex items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 px-4 text-xs font-medium text-muted-foreground h-12">
                      <span className="opacity-60">Play Store Pronto</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-muted/20 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>RECIPE Ecosistema</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} RECIPE · Universidad San Ignacio de Loyola. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            Comunidad Sostenible
          </div>
        </div>
      </footer>
    </div>
  );
}
