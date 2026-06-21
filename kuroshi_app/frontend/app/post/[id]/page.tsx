import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

const API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

async function getPost(id: string) {
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const IMAGE_URL_RE = /https?:\/\/[^\s'"]+\.(?:gif|png|jpg|jpeg|webp)(?:\?[^\s'"]*)?/gi

function extractImages(text: string): string[] {
  return text.match(IMAGE_URL_RE) ?? []
}

function renderContent(text: string) {
  const images = extractImages(text)
  const textWithoutUrls = text.replace(IMAGE_URL_RE, '').trim()
  const lines = textWithoutUrls.split('\n').filter(Boolean)

  return (
    <>
      {lines.length > 0 && (
        <p className="post-card-text">{lines.join('\n')}</p>
      )}
      {images.length > 0 && (
        <div className="post-card-images">
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="post-card-image-item" loading="lazy" />
          ))}
        </div>
      )}
    </>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  if (!post) {
    return { title: 'Publicación no encontrada - Kuroshi' }
  }

  const postUrl = `${SITE_URL}/post/${id}`
  const authorName = post.user?.username ?? 'Usuario'
  const title = `${authorName} en Kuroshi`

  const cleanContent = (post.content ?? '').replace(/[*_~#`\[\]]/g, '').slice(0, 200)
  const contentDesc = post.shared_text
    ? `${post.shared_text.slice(0, 200)}`
    : cleanContent || 'Mira esta publicación en Kuroshi'

  const images = extractImages(post.content ?? '')
  const ogImage = post.image_url ?? images[0] ?? post.user?.avatar_url ?? undefined

  return {
    title,
    description: contentDesc,
    openGraph: {
      title,
      description: contentDesc,
      url: postUrl,
      type: 'article',
      siteName: 'Kuroshi',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: contentDesc,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    return (
      <div className="not-found">
        <h1>Publicación no encontrada</h1>
        <p>Esta publicación no existe o ha sido eliminada.</p>
        <Link href="/">Volver al inicio</Link>
        <style>{`
          .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60dvh; text-align: center; padding: 2rem; color: var(--text-muted); }
          .not-found h1 { font-family: var(--font-display); font-size: 1.5rem; color: var(--text-primary); margin: 0 0 0.5rem; }
          .not-found p { margin: 0 0 1.5rem; }
          .not-found a { color: var(--accent); text-decoration: none; font-weight: 600; }
          .not-found a:hover { text-decoration: underline; }
        `}</style>
      </div>
    )
  }

  const author = post.user?.username ?? 'Usuario'

  return (
    <div className="post-redirect">
      <div className="post-card">
        <div className="post-card-header">
          <div className="post-card-avatar">
            {post.user?.avatar_url ? (
              <img src={post.user.avatar_url} alt="" className="post-card-avatar-img" />
            ) : (
              <div className="post-card-avatar-fallback">{author[0]?.toUpperCase()}</div>
            )}
          </div>
          <div className="post-card-meta">
            <Link href={`/u/${author}`} className="post-card-name">{author}</Link>
            {post.community && (
              <Link href={`/comunidades/${post.community.slug}`} className="post-card-community">
                {post.community.name}
              </Link>
            )}
          </div>
        </div>
        <div className="post-card-body">
          {renderContent(post.content ?? '')}
        </div>
        {post.image_url && (
          <div className="post-card-image-wrap">
            <img src={post.image_url} alt="" className="post-card-image" />
          </div>
        )}
        <div className="post-card-actions">
          <Link href={`/u/${author}`} className="post-card-btn">Ver perfil</Link>
          <Link href="/" className="post-card-btn post-card-btn--primary">Ir a Kuroshi</Link>
        </div>
      </div>

      <style>{`
        .post-redirect { display: flex; align-items: center; justify-content: center; min-height: 100dvh; padding: 1rem; }
        .post-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); max-width: 500px; width: 100%; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
        .post-card-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; }
        .post-card-avatar { flex-shrink: 0; }
        .post-card-avatar-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .post-card-avatar-fallback { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-dim)); color: #fff; font-family: var(--font-display); font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .post-card-meta { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
        .post-card-name { font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); text-decoration: none; }
        .post-card-name:hover { text-decoration: underline; }
        .post-card-community { font-size: 0.6875rem; font-weight: 600; color: var(--accent); background: var(--bg-overlay); padding: 0.125rem 0.5rem; border-radius: var(--radius-full); border: 1px solid var(--border); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .post-card-body { padding: 0 1.25rem 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .post-card-text { margin: 0; font-size: 0.9375rem; color: var(--text-primary); line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
        .post-card-images { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .post-card-image-item { max-height: 120px; max-width: 100%; width: auto; border-radius: var(--radius-md); object-fit: contain; }
        .post-card-image-wrap { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); display: flex; justify-content: center; background: var(--bg-overlay); padding: 0.5rem; }
        .post-card-image { max-width: 100%; max-height: 400px; width: auto; height: auto; display: block; object-fit: contain; border-radius: var(--radius-md); }
        .post-card-actions { display: flex; gap: 0.5rem; padding: 0.75rem 1.25rem; justify-content: flex-end; }
        .post-card-btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; text-decoration: none; background: var(--bg-overlay); color: var(--text-secondary); border: 1px solid var(--border); transition: all var(--transition-fast); }
        .post-card-btn:hover { border-color: var(--border-hover); color: var(--text-primary); }
        .post-card-btn--primary { background: var(--accent); color: #fff; border: none; }
        .post-card-btn--primary:hover { background: var(--accent-dim); color: #fff; }
      `}</style>
    </div>
  )
}
