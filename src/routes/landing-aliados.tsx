import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Leaf, Package, Smartphone, Sparkles, ArrowRight, Recycle, Globe } from "lucide-react";

export const Route = createFileRoute("/landing-aliados")({
  head: () => ({
    meta: [
      { title: "ReciPe - Portal Aliados USIL" },
      {
        name: "description",
        content:
          "Únete como aliado: ofrece productos a cambio de puntos a usuarios que reciclan.",
      },
    ],
  }),
  component: Landing,
});

import { useEffect } from "react";

function Landing() {
  useEffect(() => {
    document.title = "RECIPE - Portal Aliados USIL";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Recycle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>Recipe <span className="text-muted-foreground font-normal">Aliados</span></span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button>Iniciar sesión</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Iniciativa oficial USIL
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Convierte el reciclaje USIL en{" "}
              <span className="text-primary">clientes leales</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              Recipe conecta a empresas aliadas con la comunidad de la
              Universidad San Ignacio de Loyola. Publica tus productos, define
              los puntos requeridos y llega a estudiantes, docentes y staff que
              ya reciclan en el campus.
            </p>

            <div className="mt-8 flex gap-6 text-sm text-muted-foreground">
              <div><strong className="text-foreground">+8k</strong> miembros USIL</div>
              <div><strong className="text-foreground">120</strong> aliados</div>
              <div><strong className="text-foreground">5</strong> sedes activas</div>
            </div>


          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full" />
            <div className="relative grid grid-cols-2 gap-4">
              <FeatureTile icon={<Package />} title="Gestiona productos" body="Sube, edita y publica tu catálogo en segundos." />
              <FeatureTile icon={<Leaf />} title="Marca personalizada" body="Logo, portada, colores. Tú decides cómo te ven." className="mt-8" />
              <FeatureTile icon={<Smartphone />} title="Preview móvil" body="Mira tu perfil tal como lo verán los usuarios." />
              <FeatureTile icon={<Sparkles />} title="Fácil de usar" body="Edita en tiempo real con cambios instantáneos." className="mt-8" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-sm text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Recipe · Universidad San Ignacio de Loyola</span>
          <span>Portal de Aliados · USIL Sostenible</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  body,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
