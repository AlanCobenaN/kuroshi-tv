// app/registro/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from '@/app/login/LoginForm'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Regístrate en Kuroshi.lat y únete a la comunidad otaku latinoamericana.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/registro' },
}

export default function RegisterPage() {
  return <LoginForm mode="register" />
}
