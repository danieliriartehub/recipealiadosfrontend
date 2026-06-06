import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { usePortal } from "@/lib/portal-store";
import { useMerchantAuth, getUserRole, getAccessToken } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Store,
  Smartphone,
  LogOut,
  Recycle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Panel — Portal de Aliados" }] }),
  component: DashboardLayout,
});

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/products", label: "Productos", icon: Package },
  { to: "/dashboard/profile", label: "Perfil de marca", icon: Store },
  { to: "/dashboard/preview", label: "Preview móvil", icon: Smartphone },
];

function DashboardLayout() {
  const { company, logout } = usePortal();
  const { signOut } = useMerchantAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Verificar sesión y rol al montar
  useEffect(() => {
    const check = async () => {
      const token = getAccessToken()
      if (!token) {
        navigate({ to: '/login', replace: true })
        return
      }
      const role = await getUserRole('')
      if (role !== 'aliado') {
        navigate({ to: '/login', replace: true })
      }
    }
    check()
  }, [])


  useEffect(() => setOpen(false), [pathname]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const handleLogout = async () => {
    logout();
    await signOut();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/40 flex">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
          <SidebarContent
            company={company}
            isActive={isActive}
            onLogout={handleLogout}
          />
        </aside>

        {/* Mobile sheet */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="relative w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
              <SidebarContent
                company={company}
                isActive={isActive}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar mobile */}
          <header className="lg:hidden bg-background border-b border-border h-14 flex items-center justify-between px-4 sticky top-0 z-30">
            <button onClick={() => setOpen(true)} className="p-2 -ml-2">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="font-semibold text-sm truncate">{company.name}</div>
            <div className="w-8" />
          </header>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function SidebarContent({
  company,
  isActive,
  onLogout,
}: {
  company: { name: string; logo: string };
  isActive: (to: string, exact?: boolean) => boolean;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Recycle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-sm">
            Recipe
            <div className="text-xs text-muted-foreground font-normal">Aliados USIL</div>
          </span>
        </Link>
      </div>

      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary-soft overflow-hidden flex items-center justify-center">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{company.name}</div>
          <div className="text-xs text-muted-foreground">Aliado verificado</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to as "/dashboard"}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </>
  );
}
