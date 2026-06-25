'use client'

import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function PlayerWithAds({ children }: Props) {
  return <>{children}</>
}
