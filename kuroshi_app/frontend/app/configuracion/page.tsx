import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authApi } from '@/lib/api'
import { SettingsClient } from './SettingsClient'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Configuración',
  description: 'Configura tu cuenta en Kuroshi.tv',
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let emailVerified = session.user.email_verified
  let linkedMethods: string[] = []
  let twoFactorEnabled = false

  try {
    const me = await authApi.me(session.accessToken) as any
    if (me) {
      if (typeof me.email_verified === 'boolean') emailVerified = me.email_verified
      if (typeof me.two_factor_enabled === 'boolean') twoFactorEnabled = me.two_factor_enabled

      const methods: string[] = []
      if (me.oauth_google_id) methods.push('google')
      if (me.oauth_discord_id) methods.push('discord')
      if (me.password_hash) methods.push('email')
      linkedMethods = methods
    }
  } catch {}

  return (
    <>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <SettingsClient
          username={session.user.username}
          email={session.user.email}
          accessToken={session.accessToken}
          provider={session.provider}
          avatarUrl={session.user.avatar_url ?? ''}
          emailVerified={emailVerified}
          linkedMethods={linkedMethods}
          twoFactorEnabled={twoFactorEnabled}
        />
      </div>
      <Footer />
    </>
  )
}
