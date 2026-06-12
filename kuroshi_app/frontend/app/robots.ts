// app/robots.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',          // Panel de administración — privado
          '/configuracion',  // Configuración de cuenta — privado
          '/notificaciones', // Notificaciones — privado
          '/api/',           // Endpoints de la API — no indexar
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
