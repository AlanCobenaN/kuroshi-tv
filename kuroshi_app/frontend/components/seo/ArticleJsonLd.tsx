import { JsonLd } from './JsonLd'

interface ArticleJsonLdProps {
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  authorName: string
  authorUrl?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  authorName,
  authorUrl,
}: ArticleJsonLdProps) {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: title,
    description: description?.slice(0, 500),
    url,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl ? `${BASE_URL}${authorUrl}` : undefined,
    },
    datePublished: datePublished ?? new Date().toISOString(),
  }

  if (image) {
    data.image = image
  }

  return <JsonLd data={data} />
}
