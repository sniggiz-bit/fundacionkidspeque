/**
 * Layout para rutas de autenticación del admin (/admin/login)
 * No aplica el sidebar ni verifica JWT — es la puerta de entrada.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
