import { JsonLd } from './JsonLd'

interface Crumb {
  name: string
  item: string
}

export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  }
  return <JsonLd data={data} />
}
