// app/login/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Accede a Kuroshi.tv con Google, Discord o tu email.',
}

export default function LoginPage() {
  return <LoginForm mode="login" />
}
