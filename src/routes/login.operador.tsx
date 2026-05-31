import { createFileRoute, redirect } from '@tanstack/react-router'

// Stub — la ruta activa está en login_.operador.tsx
export const Route = createFileRoute('/login/operador-legacy')({
  beforeLoad: () => {
    throw redirect({ to: '/login/operador', replace: true })
  },
})
