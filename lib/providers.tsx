/**
 * lib/providers.tsx
 * ─────────────────────────────────────────────────────────────────
 * Árbol de providers del lado cliente (TanStack Query + futuros).
 * Separado del layout raíz porque los providers son "use client"
 * y el layout puede seguir siendo un Server Component.
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Instanciar QueryClient dentro del componente para garantizar que cada
  // request de SSR tenga su propio cliente (evita contaminación de caché).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            60 * 1000,  // 1 minuto por defecto
            gcTime:               5 * 60 * 1000, // 5 minutos en caché
            retry:                2,
            retryDelay:           (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            refetchOnWindowFocus: false,       // Evitar refetch al cambiar de tab
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
