export interface CompressOptions {
  maxSizeMB?: number
  maxWidth?: number
  maxHeight?: number
}

function supportsWebP(): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxSizeMB = 1, maxWidth = 1920, maxHeight = 1920 } = options

  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size <= maxBytes) return file

  const img = await createImageBitmap(file)

  let { width, height } = img
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  if (file.type === 'image/png') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)
  img.close()

  const useWebP = supportsWebP()
  const outType = useWebP ? 'image/webp' : 'image/jpeg'
  const ext = useWebP ? 'webp' : 'jpg'

  let quality = 0.85
  let blob: Blob | null = null

  while (quality > 0.1) {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), outType, quality)
    })
    if (blob.size <= maxBytes) break
    quality -= 0.1
  }

  const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([blob!], name, { type: outType })
}
