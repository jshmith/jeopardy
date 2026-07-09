import { parseMediaUrl } from '../lib/mediaSource'
import { HostVideo, ViewerVideo } from './SyncedVideo'
import type { CurrentClue, VideoSyncState } from '../types/game'

/** Who is looking at this clue: the host (controls video playback, publishes state)
 * or a player (video follows the host's state). */
export type VideoContext =
  | { role: 'host'; roomCode: string }
  | { role: 'viewer'; sync: VideoSyncState | null }

type Props = {
  clue: CurrentClue
  video?: VideoContext
}

function ClueMedia({ url, video }: { url: string; video?: VideoContext }) {
  const source = parseMediaUrl(url)
  if (source.kind === 'image') {
    return (
      <img src={source.url} alt="" className="relative max-h-80 max-w-full rounded-xl object-contain shadow-lg" />
    )
  }
  if (video?.role === 'host') return <HostVideo url={url} roomCode={video.roomCode} />
  if (video?.role === 'viewer') return <ViewerVideo url={url} sync={video.sync} />
  // No sync context supplied — plain playback fallback.
  if (source.kind === 'youtube') {
    return (
      <iframe
        src={source.embedUrl}
        title="Clue video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="relative aspect-video w-full max-w-2xl rounded-xl shadow-lg"
      />
    )
  }
  return <video src={source.url} controls className="relative max-h-80 max-w-full rounded-xl shadow-lg" />
}

export function ClueDisplay({ clue, video }: Props) {
  return (
    <div className="animate-clue-in relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-jeopardy-blue to-jeopardy-blue-dark p-8 text-center shadow-2xl shadow-black/40 md:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 60%)' }}
      />
      <p className="relative font-jeopardy text-2xl leading-snug text-white md:text-4xl">{clue.text}</p>
      {clue.imageUrl && <ClueMedia url={clue.imageUrl} video={video} />}
      {clue.revealedAnswer && (
        <p className="animate-fade-in-up relative font-jeopardy text-xl text-jeopardy-gold md:text-2xl">
          {clue.revealedAnswer}
        </p>
      )}
    </div>
  )
}
