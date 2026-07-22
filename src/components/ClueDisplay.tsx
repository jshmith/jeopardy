import { parseMediaUrl } from '../lib/mediaSource'
import { HostVideo, ViewerVideo } from './SyncedVideo'
import type { CurrentClue, VideoSyncState } from '../types/game'

/** Who is looking at this clue: the host (controls video playback, publishes state)
 * or a player (video follows the host's state). */
export type VideoContext =
  | { role: 'host'; roomCode: string }
  | { role: 'viewer'; sync: VideoSyncState | null; clockOffsetMs: number }

type Props = {
  clue: CurrentClue
  video?: VideoContext
}

function ClueMedia({ url, video, audioOnly }: { url: string; video?: VideoContext; audioOnly?: boolean }) {
  const source = parseMediaUrl(url)
  if (source.kind === 'image') {
    return (
      <img
        src={source.url}
        alt=""
        className="crt-media-safe h-auto max-h-[28rem] w-full max-w-2xl rounded-xl object-contain shadow-lg"
      />
    )
  }
  if (video?.role === 'host') return <HostVideo url={url} roomCode={video.roomCode} />
  if (video?.role === 'viewer')
    return <ViewerVideo url={url} sync={video.sync} clockOffsetMs={video.clockOffsetMs} audioOnly={audioOnly} />
  // No sync context supplied — plain playback fallback.
  if (source.kind === 'youtube') {
    return (
      <iframe
        src={source.embedUrl}
        title="Clue video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="crt-media-safe aspect-video w-full max-w-2xl rounded-xl shadow-lg"
      />
    )
  }
  return <video src={source.url} controls className="crt-media-safe max-h-80 max-w-full rounded-xl shadow-lg" />
}

export function ClueDisplay({ clue, video }: Props) {
  return (
    <div className="animate-clue-in relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-crt-cream/10 bg-gradient-to-b from-crt-bg-light to-crt-bg p-8 text-center shadow-2xl shadow-black/40 md:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(244,234,216,0.12), transparent 60%)' }}
      />
      <p className="relative font-display text-2xl font-medium leading-snug text-crt-cream md:text-4xl">
        {clue.text}
      </p>
      {clue.imageUrl && (
        <ClueMedia url={clue.imageUrl} video={video} audioOnly={clue.hideVideoFromPlayers ?? false} />
      )}
      {clue.revealedAnswer && (
        <p className="animate-fade-in-up relative font-display text-2xl font-medium text-crt-amber-light md:text-3xl">
          {clue.revealedAnswer}
        </p>
      )}
    </div>
  )
}
