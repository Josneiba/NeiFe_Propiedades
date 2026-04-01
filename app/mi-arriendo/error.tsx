"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Algo salió mal</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || "Ocurrió un error al cargar la página"}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  )
}
