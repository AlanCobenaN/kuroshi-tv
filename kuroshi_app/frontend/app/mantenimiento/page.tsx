import type { Metadata } from 'next'
import { MaintenancePage } from '@/components/layout/MaintenancePage'

export const metadata: Metadata = {
  title: 'Mantenimiento',
  robots: { index: false, follow: false },
}

export default function MantenimientoPageRoute() {
  return <MaintenancePage />
}
