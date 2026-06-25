// app/login/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Accede a Kuroshi.lat con Google, Discord o tu email.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
}

export default function LoginPage() {
  return <LoginForm mode="login" />
}
