import { useEffect, useRef, useState } from 'react'
import { getYouTubeVideoId } from '../lib/mediaSource'
import { loadYouTubeApi, type YTPlayer } from '../lib/youtubeApi'
import { setVideoSync } from '../features/game/gameStateMachine'
import type { VideoSyncState } from '../types/game'

/** Ignore drift below this — constant small seeks are worse than being 1s off. */
const SEEK_TOLERANCE_S = 1.5

/** Shave this much off the extrapolated position — a small safety margin against
 * residual clock-offset error and listener latency, so a viewer lands a touch behind
 * the "exact" position instead of risking overshooting past a short clip's end. */
const PLAYBACK_CATCHUP_PAD_S = 0.4

function targetPosition(sync: VideoSyncState, clockOffsetMs: number): number {
  if (sync.status !== 'playing') return sync.time
  const elapsed = (Date.now() + clockOffsetMs - sync.setAt.toMillis()) / 1000
  return sync.time + Math.max(0, elapsed - PLAYBACK_CATCHUP_PAD_S)
}

// ---- Host side: normal controls, publishes state to the game doc ----

export function HostVideo({ url, roomCode }: { url: string; roomCode: string }) {
  const youTubeId = getYouTubeVideoId(url)
  return youTubeId ? (
    <HostYouTube videoId={youTubeId} roomCode={roomCode} />
  ) : (
    <HostFileVideo url={url} roomCode={roomCode} />
  )
}

function HostFileVideo({ url, roomCode }: { url: string; roomCode: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  function publish(status: VideoSyncState['status']) {
    const v = ref.current
    if (!v) return
    void setVideoSync(roomCode, { status, time: v.currentTime })
  }

  return (
    <video
      ref={ref}
      src={url}
      controls
      playsInline
      onPlay={() => publish('playing')}
      onPause={() => publish('paused')}
      onSeeked={() => publish(ref.current?.paused ? 'paused' : 'playing')}
      className="crt-media-safe max-h-80 max-w-full rounded-xl shadow-lg"
    />
  )
}

function HostYouTube({ videoId, roomCode }: { videoId: string; roomCode: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              void setVideoSync(roomCode, { status: 'playing', time: e.target.getCurrentTime() })
            } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
              void setVideoSync(roomCode, { status: 'paused', time: e.target.getCurrentTime() })
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId, roomCode])

  return (
    <div className="crt-media-safe aspect-video w-full max-w-2xl overflow-hidden rounded-xl shadow-lg">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}

// ---- Viewer side: no controls, follows the host's published state ----

export function ViewerVideo({
  url,
  sync,
  clockOffsetMs,
  audioOnly = false,
}: {
  url: string
  sync: VideoSyncState | null
  clockOffsetMs: number
  audioOnly?: boolean
}) {
  const youTubeId = getYouTubeVideoId(url)
  const [audioEnabled, setAudioEnabled] = useState(false)

  return (
    <div className="crt-media-safe w-full max-w-2xl">
      {youTubeId ? (
        <ViewerYouTube videoId={youTubeId} sync={sync} clockOffsetMs={clockOffsetMs} muted={!audioEnabled} />
      ) : (
        <ViewerFileVideo url={url} sync={sync} clockOffsetMs={clockOffsetMs} muted={!audioEnabled} />
      )}
      {audioOnly && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 rounded-xl bg-black">
          <span className="text-4xl">🎵</span>
          <span className="text-sm text-crt-cream/50">Audio only — listen closely!</span>
        </div>
      )}
      {!audioEnabled && (
        <button
          onClick={() => setAudioEnabled(true)}
          className="absolute inset-x-0 bottom-3 z-10 mx-auto w-fit cursor-pointer animate-pulse rounded-full bg-black/75 px-4 py-2 text-sm font-semibold text-crt-cream shadow-lg backdrop-blur transition hover:bg-black/90"
        >
          🔇 Tap to enable sound
        </button>
      )}
      <p className="mt-2 text-center text-xs text-crt-cream/40">The host controls playback</p>
    </div>
  )
}

function ViewerFileVideo({
  url,
  sync,
  clockOffsetMs,
  muted,
}: {
  url: string
  sync: VideoSyncState | null
  clockOffsetMs: number
  muted: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v || !sync) return
    const apply = () => {
      const target = targetPosition(sync, clockOffsetMs)
      if (Math.abs(v.currentTime - target) > SEEK_TOLERANCE_S) v.currentTime = target
      if (sync.status === 'playing') void v.play().catch(() => {})
      else v.pause()
    }
    if (v.readyState >= 1) apply()
    v.addEventListener('loadedmetadata', apply)
    return () => v.removeEventListener('loadedmetadata', apply)
  }, [sync, clockOffsetMs])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = muted
    // Unmuting is a user gesture; retry playback in case the muted-autoplay path failed.
    if (!muted && sync?.status === 'playing') void v.play().catch(() => {})
  }, [muted, sync])

  return (
    <video
      ref={ref}
      src={url}
      muted={muted}
      playsInline
      className="pointer-events-none mx-auto max-h-80 max-w-full rounded-xl shadow-lg"
    />
  )
}

function ViewerYouTube({
  videoId,
  sync,
  clockOffsetMs,
  muted,
}: {
  videoId: string
  sync: VideoSyncState | null
  clockOffsetMs: number
  muted: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const syncRef = useRef(sync)
  syncRef.current = sync
  const offsetRef = useRef(clockOffsetMs)
  offsetRef.current = clockOffsetMs

  function applySync(player: YTPlayer, state: VideoSyncState | null) {
    if (!state) return
    const target = targetPosition(state, offsetRef.current)
    if (Math.abs(player.getCurrentTime() - target) > SEEK_TOLERANCE_S) player.seekTo(target, true)
    if (state.status === 'playing') player.playVideo()
    else player.pauseVideo()
  }

  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: (e) => {
            e.target.mute() // muted until the viewer taps "enable sound"
            setReady(true)
            applySync(e.target, syncRef.current)
          },
        },
      })
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  useEffect(() => {
    if (ready && playerRef.current) applySync(playerRef.current, sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sync])

  useEffect(() => {
    const player = playerRef.current
    if (!ready || !player) return
    if (muted) player.mute()
    else {
      player.unMute()
      // The unmute click is a user gesture; retry playback in case autoplay was blocked.
      if (syncRef.current?.status === 'playing') player.playVideo()
    }
  }, [muted, ready])

  return (
    <div className="pointer-events-none relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
