import { createFileRoute, redirect } from '@tanstack/react-router'

// Stub — la ruta activa está en dashboard_.operador.tsx
export const Route = createFileRoute('/dashboard/operador-legacy')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/operador', replace: true })
  },
})
