import { JsonLd } from './JsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export function WebPageJsonLd({
  name,
  description,
  url,
  mainEntity,
  breadcrumb,
}: {
  name: string
  description: string
  url: string
  mainEntity?: { '@type': string; '@id'?: string; name?: string; url?: string }
  breadcrumb?: { '@type': string; '@id': string }
}) {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': url,
    url,
    name,
    description: description?.slice(0, 500),
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
    },
    inLanguage: 'es',
    lastReviewed: new Date().toISOString().split('T')[0],
  }

  if (mainEntity) {
    data.mainEntity = mainEntity
  }

  if (breadcrumb) {
    data.breadcrumb = breadcrumb
  }

  return <JsonLd data={data} />
}
