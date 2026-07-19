import { useState } from 'react'
import { btnPrimary, btnQuiet, inputBase } from '../../lib/uiClasses'
import { parseMediaUrl } from '../../lib/mediaSource'
import type { BoardClue, ClueMode } from '../../types/game'

type Props = {
  clue: BoardClue
  onSave: (clue: BoardClue) => void
  onClose: () => void
}

export function ClueEditor({ clue, onSave, onClose }: Props) {
  const [text, setText] = useState(clue.text)
  const [imageUrl, setImageUrl] = useState(clue.imageUrl ?? '')
  const [answer, setAnswer] = useState(clue.answer)
  const [isDailyDouble, setIsDailyDouble] = useState(clue.isDailyDouble)
  const [mode, setMode] = useState<ClueMode>(clue.mode ?? 'standard')
  const [hideVideoFromPlayers, setHideVideoFromPlayers] = useState(clue.hideVideoFromPlayers ?? false)

  const trimmedUrl = imageUrl.trim()
  const mediaIsVideo = trimmedUrl !== '' && parseMediaUrl(trimmedUrl).kind !== 'image'
  const imagePreviewUrl = trimmedUrl !== '' && !mediaIsVideo ? trimmedUrl : ''
  const [imageError, setImageError] = useState(false)

  function handleUrlChange(value: string) {
    setImageUrl(value)
    setImageError(false)
  }

  function handleSave() {
    onSave({
      ...clue,
      text: text.trim(),
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      answer: answer.trim(),
      isDailyDouble,
      mode,
      hideVideoFromPlayers: mediaIsVideo && hideVideoFromPlayers,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-fade-in-up w-full max-w-lg rounded-2xl border border-crt-cream/10 bg-gradient-to-b from-crt-bg-light to-crt-bg p-6 text-crt-cream shadow-2xl shadow-black/50">
        <h2 className="mb-5 font-display text-xl font-medium text-crt-amber-light">Edit ${clue.value} Clue</h2>

        <label className="mb-3 block text-sm text-crt-cream/70">
          Clue text
          <textarea
            className={`mt-1 w-full ${inputBase}`}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label className="mb-3 block text-sm text-crt-cream/70">
          Image or video URL (optional)
          <input
            className={`mt-1 w-full ${inputBase}`}
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://... (image, YouTube link, or .mp4)"
          />
          {imagePreviewUrl && (
            <div className="mt-2 overflow-hidden rounded-lg border border-crt-cream/10 bg-black/20">
              {imageError ? (
                <p className="p-3 text-xs text-crt-cream/40">Couldn't load image from this URL</p>
              ) : (
                <img
                  src={imagePreviewUrl}
                  alt="Clue preview"
                  className="max-h-40 w-full object-contain"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              )}
            </div>
          )}
        </label>

        <label className="mb-4 block text-sm text-crt-cream/70">
          Correct answer
          <input
            className={`mt-1 w-full ${inputBase}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </label>

        {mediaIsVideo && (
          <label className="mb-3 flex items-center justify-between text-sm text-crt-cream/70">
            <span>
              Audio only for players
              <span className="block text-xs text-crt-cream/40">
                Players get a black screen with sound — you still see the video
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={hideVideoFromPlayers}
              onClick={() => setHideVideoFromPlayers((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-amber/60 ${
                hideVideoFromPlayers ? 'bg-crt-amber' : 'bg-crt-cream/15'
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  hideVideoFromPlayers ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        )}

        <div className="mb-4 text-sm text-crt-cream/70">
          Clue type
          <div className={`mt-1 inline-flex w-full gap-1 rounded-xl bg-crt-cream/5 p-1 ${isDailyDouble ? 'opacity-40' : ''}`}>
            {(
              [
                { value: 'standard', label: 'Standard (buzz-in)' },
                { value: 'host_control', label: "Host's choice" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={isDailyDouble}
                onClick={() => setMode(opt.value)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition duration-150 ${
                  mode === opt.value
                    ? 'bg-crt-amber text-crt-bg shadow-md'
                    : 'text-crt-cream/70 hover:bg-crt-cream/10 hover:text-crt-cream'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isDailyDouble && (
            <p className="mt-1 text-xs text-crt-cream/40">Daily Doubles always use the wager flow.</p>
          )}
          {mode === 'host_control' && !isDailyDouble && (
            <p className="mt-1 text-xs text-crt-cream/40">
              No buzzers — you pick which player gets the money.
            </p>
          )}
        </div>

        <label className="mb-5 flex items-center justify-between text-sm text-crt-cream/70">
          Daily Double
          <button
            type="button"
            role="switch"
            aria-checked={isDailyDouble}
            onClick={() => setIsDailyDouble((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-amber/60 ${
              isDailyDouble ? 'bg-crt-amber' : 'bg-crt-cream/15'
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                isDailyDouble ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        <div className="flex justify-end gap-2">
          <button className={btnQuiet} onClick={onClose}>
            Cancel
          </button>
          <button className={btnPrimary} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
