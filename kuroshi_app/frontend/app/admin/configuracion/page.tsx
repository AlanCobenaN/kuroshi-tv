'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { adminApi } from '@/lib/api'

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const snakeToCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(snakeToCamel)
    if (obj !== null && typeof obj === 'object') {
      const result: any = {}
      for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
        result[camelKey] = snakeToCamel(obj[key])
      }
      return result
    }
    return obj
  }

  useEffect(() => {
    if (!session?.accessToken) return
    adminApi.getSettings(session.accessToken)
      .then((data: any) => {
        const converted = snakeToCamel(data)
        setSettings(converted)
        setForm({ ...converted })
      })
      .catch(() => setError('Error al cargar configuración'))
  }, [session])

  const handleSave = async () => {
    if (!session?.accessToken) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await adminApi.updateSettings(form, session.accessToken)
      setSettings(updated)
      setMessage('Configuración guardada correctamente')
    } catch {
      setError('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (!settings && !error) return <p className="admin-loading">Cargando configuración...</p>

  const update = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }))

  return (
    <div>
      <h1 className="admin-title" style={{ marginBottom: '1.5rem' }}>Configuración Global</h1>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div className="admin-settings">
        <div className="settings-section">
          <h2>Datos del Sitio</h2>
          <div className="settings-field">
            <label>Nombre del sitio</label>
            <input type="text" value={form.siteName ?? ''} onChange={e => update('siteName', e.target.value)} className="input" />
          </div>
          <div className="settings-field">
            <label>Descripción (SEO)</label>
            <textarea value={form.siteDescription ?? ''} onChange={e => update('siteDescription', e.target.value)} className="input" rows={3} />
          </div>
        </div>

        <div className="settings-section">
          <h2>Registro y Acceso</h2>
          <div className="settings-field-row">
            <label>Permitir nuevos registros</label>
            <input type="checkbox" checked={form.allowRegistration ?? true} onChange={e => update('allowRegistration', e.target.checked)} />
          </div>
          <div className="settings-field-row">
            <label>Requerir verificación de email</label>
            <input type="checkbox" checked={form.requireEmailVerification ?? false} onChange={e => update('requireEmailVerification', e.target.checked)} />
          </div>
        </div>

        <div className="settings-section">
          <h2>Anuncios — Configuración Global</h2>
          <div className="settings-field-row">
            <label>Anuncio pre-roll activado</label>
            <input type="checkbox" checked={form.adPrerollGlobalEnabled ?? true} onChange={e => update('adPrerollGlobalEnabled', e.target.checked)} />
          </div>
          <div className="settings-field">
            <label>Frecuencia de anuncios en feed (cada N posts)</label>
            <input type="number" value={form.adFeedFrequency ?? 5} onChange={e => update('adFeedFrequency', parseInt(e.target.value) || 5)} className="input" style={{ maxWidth: 100 }} />
          </div>
        </div>

        <div className="settings-section">
          <h2>Mantenimiento</h2>
          <div className="settings-field-row">
            <label>Modo mantenimiento activado</label>
            <input type="checkbox" checked={form.maintenanceMode ?? false} onChange={e => update('maintenanceMode', e.target.checked)} />
          </div>
          <div className="settings-field">
            <label>Mensaje de mantenimiento</label>
            <textarea value={form.maintenanceMessage ?? ''} onChange={e => update('maintenanceMessage', e.target.value)} className="input" rows={3} />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ marginTop: '1rem' }}>
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>

      <style>{`
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-loading { color: var(--text-muted); }
        .admin-error { color: var(--accent); }
        .admin-success { color: var(--success, #22c55e); font-size: 0.875rem; margin-bottom: 1rem; }
        .admin-settings { display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px; }
        .settings-section { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .settings-section h2 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
        .settings-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .settings-field label { font-size: 0.8125rem; color: var(--text-muted); }
        .settings-field-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .settings-field-row label { font-size: 0.875rem; color: var(--text-secondary); }
      `}</style>
    </div>
  )
}
