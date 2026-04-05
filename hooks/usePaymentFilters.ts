import { useSearchParams } from 'next/navigation'

export interface Payment {
  id: string
  month: string
  total: number
  rent: number
  water: number
  electricity: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paidDate: string | null
  receipt: string | null
  propertyId?: string
  tenantName?: string
}

interface FilterParams {
  propertyId?: string
  status?: string
  month?: string
  year?: string
  search?: string
}

/**
 * Hook para filtrar pagos en base a URL searchParams
 * Simula una búsqueda en base de datos sin requerir backend
 */
export function usePaymentFilters(allPayments: Payment[]) {
  const searchParams = useSearchParams()

  const filters: FilterParams = {
    propertyId:
      searchParams.get('property') || searchParams.get('propertyId') || undefined,
    status: searchParams.get('status') || undefined,
    month: searchParams.get('month') || undefined,
    year: searchParams.get('year') || undefined,
    search: searchParams.get('search') || undefined,
  }

  // Filtrar pagos según criterios
  let filtered = allPayments

  if (filters.propertyId) {
    filtered = filtered.filter(p => p.propertyId === filters.propertyId)
  }

  if (filters.status) {
    filtered = filtered.filter(p => p.status === filters.status)
  }

  if (filters.month) {
    const monthNum = parseInt(filters.month)
    filtered = filtered.filter(p => {
      const paymentMonth = parseInt(p.month.split('/')[1])
      return paymentMonth === monthNum
    })
  }

  if (filters.year) {
    filtered = filtered.filter(p => p.month.includes(filters.year!))
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(p =>
      (p.tenantName?.toLowerCase().includes(searchLower)) ||
      (p.month.toLowerCase().includes(searchLower))
    )
  }

  return {
    filteredPayments: filtered,
    totalCount: allPayments.length,
    filteredCount: filtered.length,
    hasFilters: Object.values(filters).some(v => v),
    filters
  }
}
