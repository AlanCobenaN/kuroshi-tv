import { JsonLd } from './JsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

interface Crumb {
  name: string
  item: string
}

export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null

  const lastItem = items[items.length - 1]
  const breadcrumbId = `${lastItem.item}#breadcrumb`

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId,
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  }
  return <JsonLd data={data} />
}
