"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function PropertiesError({
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
        <h2 className="text-2xl font-bold mb-2">Error en propiedades</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || "No se pudieron cargar las propiedades"}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  )
}
