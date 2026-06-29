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

export function ItemListJsonLd({ items, itemType = 'TVSeries' }: { items: Item[]; itemType?: string }) {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': itemType,
        name: item.title,
        url: `${BASE_URL}${item.url}`,
        ...(item.image ? { image: item.image } : {}),
        ...(item.rating ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            bestRating: 10,
            worstRating: 0,
            ratingCount: item.ratingCount ?? 1,
          },
        } : {}),
      },
    })),
  }

  return <JsonLd data={data} />
}
