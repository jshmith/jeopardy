/** Detects what a pasted media URL is so one field can hold an image, a YouTube
 * link, or a direct video file. Anything unrecognized falls back to image. */

export type MediaSource =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'video'; url: string }
  | { kind: 'image'; url: string }

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?.*?v=([\w-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/,
]

const VIDEO_FILE_PATTERN = /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i

export function getYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function parseMediaUrl(url: string): MediaSource {
  const youTubeId = getYouTubeVideoId(url)
  if (youTubeId) {
    return { kind: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${youTubeId}` }
  }
  if (VIDEO_FILE_PATTERN.test(url)) return { kind: 'video', url }
  return { kind: 'image', url }
}
