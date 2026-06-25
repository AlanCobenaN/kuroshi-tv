'use client'

import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function CatalogWithAds({ children }: Props) {
  return <>{children}</>
}
