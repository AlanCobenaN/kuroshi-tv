import { JsonLd } from './JsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

interface Item {
  title: string
  url: string
  image?: string
  rating?: number
  ratingCount?: number
  position: number
}

export function ItemListJsonLd({ items, itemType = 'TVSeries', url }: { items: Item[]; itemType?: string; url?: string }) {
  if (items.length === 0) return null

  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(url ? { '@id': url, url } : {}),
    numberOfItems: items.length,
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      url: `${BASE_URL}${item.url}`,
      item: {
        '@type': itemType,
        '@id': `${BASE_URL}${item.url}`,
        name: item.title,
        url: `${BASE_URL}${item.url}`,
        ...(item.image ? { image: item.image } : {}),
        ...(item.rating ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            bestRating: 10,
            worstRating: 0,
            ratingCount: Math.max(1, item.ratingCount ?? 1),
          },
        } : {}),
      },
    })),
  }

  return <JsonLd data={data} />
}
