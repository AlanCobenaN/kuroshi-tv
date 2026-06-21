'use client'

import { Fragment } from 'react'

interface Props {
  content: string
  className?: string
}

export function RichText({ content, className }: Props) {
  const segments = parseRichText(content)

  return (
    <div className={className ?? 'rich-text'}>
      {segments.map((seg, i) => {
        if (seg.type === 'image') {
          return (
            <img key={i} src={seg.url!} alt="" className="rich-image" loading="lazy" />
          )
        }
        if (seg.type === 'link') {
          return (
            <a key={i} href={seg.url} target="_blank" rel="noopener noreferrer" className="rich-link">
              {seg.text ?? seg.url}
            </a>
          )
        }
        if (seg.type === 'bolditalic') {
          return <strong key={i} className="rich-bold"><em>{seg.text}</em></strong>
        }
        if (seg.type === 'bold') {
          return <strong key={i} className="rich-bold">{seg.text}</strong>
        }
        if (seg.type === 'italic') {
          return <em key={i} className="rich-italic">{seg.text}</em>
        }
        if (seg.type === 'strikethrough') {
          return <del key={i} className="rich-del">{seg.text}</del>
        }
        if (seg.type === 'underline') {
          return <u key={i} className="rich-u">{seg.text}</u>
        }
        if (seg.type === 'size') {
          const sizeClass = seg.size === 'small' ? 'rich-small' : seg.size === 'large' ? 'rich-large' : 'rich-xlarge'
          return <span key={i} className={sizeClass}>{seg.text}</span>
        }
        return <Fragment key={i}>{seg.text}</Fragment>
      })}

      <style>{`
        .rich-text { white-space: pre-wrap; word-wrap: break-word; line-height: 1.65; }
        .rich-link { color: var(--accent); text-decoration: underline; word-break: break-all; }
        .rich-link:hover { color: var(--accent-dim); }
        .rich-bold { font-weight: 700; }
        .rich-italic { font-style: italic; }
        .rich-del { text-decoration: line-through; }
        .rich-u { text-decoration: underline; }
        .rich-small { font-size: 0.8125rem; color: var(--text-muted); }
        .rich-large { font-size: 1.25rem; font-weight: 600; }
        .rich-xlarge { font-size: 1.5rem; font-weight: 700; }
        .rich-image { max-width: 100%; max-height: 300px; border-radius: var(--radius-md); margin: 0.5rem 0; display: block; }
      `}</style>
    </div>
  )
}

type Segment =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'bolditalic'; text: string }
  | { type: 'strikethrough'; text: string }
  | { type: 'underline'; text: string }
  | { type: 'size'; text: string; size: 'small' | 'large' | 'xlarge' }
  | { type: 'image'; url: string }
  | { type: 'link'; url: string; text?: string }

function parseRichText(input: string): Segment[] {
  const segments: Segment[] = []
  let remaining = input

  while (remaining.length > 0) {
    // Image/GIF URL
    const imgMatch = remaining.match(/^https?:\/\/[^\s]+\.(gif|webp|png|jpe?g|mp4)(\?[^\s]*)?/i)
    if (imgMatch) {
      segments.push({ type: 'image', url: imgMatch[0] })
      remaining = remaining.slice(imgMatch[0].length)
      continue
    }

    // Size tags: <small>, <large>, <xlarge>
    const sizeMatch = remaining.match(/^<(small|large|xlarge)>([\s\S]*?)<\/(small|large|xlarge)>/)
    if (sizeMatch && sizeMatch[1] === sizeMatch[3]) {
      segments.push({ type: 'size', text: sizeMatch[2], size: sizeMatch[1] as 'small' | 'large' | 'xlarge' })
      remaining = remaining.slice(sizeMatch[0].length)
      continue
    }

    // ***bold+italic***
    const biMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/)
    if (biMatch) {
      segments.push({ type: 'bolditalic', text: biMatch[1] })
      remaining = remaining.slice(biMatch[0].length)
      continue
    }

    // **bold**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      segments.push({ type: 'bold', text: boldMatch[1] })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // *italic*
    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      segments.push({ type: 'italic', text: italicMatch[1] })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // ~~strikethrough~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/)
    if (strikeMatch) {
      segments.push({ type: 'strikethrough', text: strikeMatch[1] })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // __underline__
    const underMatch = remaining.match(/^__([^_]+)__/)
    if (underMatch) {
      segments.push({ type: 'underline', text: underMatch[1] })
      remaining = remaining.slice(underMatch[0].length)
      continue
    }

    // Non-image URL → clickable link
    const linkMatch = remaining.match(/^https?:\/\/[^\s]+/)
    if (linkMatch && !imgMatch) {
      segments.push({ type: 'link', url: linkMatch[0] })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Plain text
    const nextSpecial = remaining.search(/[\*<~_]|https?:\/\//)
    if (nextSpecial === 0) {
      segments.push({ type: 'text', text: remaining[0] })
      remaining = remaining.slice(1)
    } else if (nextSpecial > 0) {
      segments.push({ type: 'text', text: remaining.slice(0, nextSpecial) })
      remaining = remaining.slice(nextSpecial)
    } else {
      segments.push({ type: 'text', text: remaining })
      remaining = ''
    }
  }

  return segments
}
