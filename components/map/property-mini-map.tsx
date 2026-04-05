'use client'

import dynamic from 'next/dynamic'

const MiniMapInner = dynamic(() => import('@/components/map/mini-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] bg-muted animate-pulse rounded-b-xl" />
  ),
})

type Props = {
  lat: number
  lng: number
  address: string
}

export function PropertyMiniMap(props: Props) {
  return <MiniMapInner {...props} />
}
