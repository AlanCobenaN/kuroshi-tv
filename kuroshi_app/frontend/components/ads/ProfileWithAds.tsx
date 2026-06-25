'use client'

import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ProfileWithAds({ children }: Props) {
  return <div className="container">{children}</div>
}
