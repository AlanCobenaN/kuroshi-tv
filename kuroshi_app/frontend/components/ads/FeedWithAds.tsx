'use client'

import { GlobalFeed } from '@/components/community/GlobalFeed'

interface Props {
  isLoggedIn?: boolean
  accessToken?: string
}

export function FeedWithAds({ isLoggedIn, accessToken }: Props) {
  return <GlobalFeed isLoggedIn={isLoggedIn} accessToken={accessToken} />
}
