'use client'

import { useEffect, useState, useCallback } from 'react'

export function useCrmAlerts() {
  const [alerts, setAlerts] = useState({
    totalAlerts: 0,
    coldDeals: [],
    overdueTasks: 0,
    expiringContracts: 0,
  })

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/crm-alerts')
      if (res.ok) setAlerts(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetch_()
    // Polling cada 5 minutos si el tab está activo
    const id = setInterval(() => {
      if (!document.hidden) fetch_()
    }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetch_])

  return { ...alerts, refresh: fetch_ }
}
