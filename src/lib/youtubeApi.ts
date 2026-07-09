/** Lazy loader + minimal typings for the YouTube IFrame Player API, which is the
 * only way to control an embedded YouTube video programmatically. */

export type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  mute(): void
  unMute(): void
  destroy(): void
}

export type YTPlayerState = {
  PLAYING: number
  PAUSED: number
  ENDED: number
}

export type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (e: { target: YTPlayer }) => void
        onStateChange?: (e: { target: YTPlayer; data: number }) => void
      }
    },
  ) => YTPlayer
  PlayerState: YTPlayerState
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT!)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiPromise
}
