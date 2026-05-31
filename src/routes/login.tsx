import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMerchantAuth } from "@/lib/auth";
import { Eye, EyeOff, Loader2, Recycle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Portal de Aliados" }] }),
  component: LoginPage,
});

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function LoginPage() {
  const { signIn } = useMerchantAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = isValidEmail(email) && password.length > 0 && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      setErrorMsg(error);
      return;
    }

    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para gestionar tu catálogo y perfil."
    >
      <form onSubmit={submit} className="space-y-4">
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
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[<>'"`;\\]/g, "");
                setPassword(sanitized);
              }}
              maxLength={72}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
          disabled={!canSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ingresando…
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Problemas para ingresar? Contacta al administrador.
      </p>
    </AuthLayout>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
            "Conectamos con cientos de estudiantes USIL en nuestra primera semana como aliados Recipe."
          </p>
          <p className="mt-4 text-primary-foreground/80">— María, Cafetería Campus USIL</p>
        </div>
        {/* Acento ámbar */}
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
