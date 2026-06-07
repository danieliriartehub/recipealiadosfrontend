import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMerchantAuth } from "@/lib/auth";
import { Eye, EyeOff, Loader2, Recycle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Portal de Aliados" }] }),
  component: LoginPage,
});

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useMerchantAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown de bloqueo
  useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((blockedUntil.getTime() - Date.now()) / 1000)
      );
      setCountdown(diff);
      if (diff === 0) {
        setBlockedUntil(null);
        setAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockedUntil) return;
    setLoading(true);
    setError(null);

    const { role, error: authError } = await signIn(email, password);

    if (authError) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) setBlockedUntil(new Date(Date.now() + 5 * 60 * 1000));
      setError(
        authError === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError
      );
      setLoading(false);
      return;
    }

    if (role === "operador") {
      navigate({ to: "/dashboard/operador", replace: true });
    } else {
      navigate({ to: "/dashboard", replace: true });
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para gestionar tu catálogo y perfil."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Field label="Correo de la empresa">
            <Input
              type="email"
              placeholder="hola@miempresa.com"
              value={email}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[<>'"`;\\]/g, "");
                setEmail(sanitized);
                setEmailError(
                  sanitized && !isValidEmail(sanitized)
                    ? "Ingresa un correo válido"
                    : null
                );
              }}
              disabled={!!blockedUntil}
              required
            />
          </Field>
          {emailError && (
            <p className="text-xs text-destructive">{emailError}</p>
          )}
        </div>

        <Field label="Contraseña">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value.replace(/[<>'"`;\\]/g, ""))
              }
              maxLength={72}
              autoComplete="current-password"
              disabled={!!blockedUntil}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        {/* Bloqueo por intentos */}
        {blockedUntil && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-sm font-semibold text-red-700">
              Demasiados intentos
            </p>
            <p className="text-xs text-red-500 mt-1">
              Espera {Math.floor(countdown / 60)}:
              {String(countdown % 60).padStart(2, "0")}
            </p>
          </div>
        )}

        {error && !blockedUntil && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
          disabled={!email || !password || loading || !!blockedUntil}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        ¿Problemas para ingresar? Contacta al administrador.
      </p>

      {/* Acceso operadores */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">
            ¿Eres personal USIL?
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/login/operador" })}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <ShieldCheck className="h-4 w-4" />
        Ingreso Operadores de Centro
      </button>
    </AuthLayout>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Panel izquierdo — gradiente verde con acentos ámbar */}
      <div
        className="hidden md:flex flex-col justify-between p-10 text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Link to="/" className="flex items-center gap-2 font-semibold relative z-10">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </div>
          Recipe Aliados
        </Link>
        <div className="relative z-10">
          <p className="text-3xl font-semibold leading-snug max-w-sm">
            "Conectamos con cientos de estudiantes USIL en nuestra primera
            semana como aliados Recipe."
          </p>
          <p className="mt-4 text-primary-foreground/80">
            — María, Cafetería Campus USIL
          </p>
        </div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-400/25 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-300/15 rounded-full blur-3xl" />
      </div>

      {/* Panel derecho — fondo blanco */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-white">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden flex items-center gap-2 font-semibold mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Recycle className="w-5 h-5 text-primary-foreground" />
            </div>
            Recipe
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
