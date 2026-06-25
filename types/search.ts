export type SearchResultType =
  | 'contact'
  | 'deal'
  | 'property'
  | 'maintenance'
  | 'contract'
  | 'statement'
  | 'task'

export interface GlobalSearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  badge?: string
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
  href: string
  meta?: string
}
