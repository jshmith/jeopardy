import { useState } from 'react'
import { btnPrimary, btnQuiet, inputBase } from '../../lib/uiClasses'
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

  function handleSave() {
    onSave({
      ...clue,
      text: text.trim(),
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      answer: answer.trim(),
      isDailyDouble,
      mode,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-fade-in-up w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-jeopardy-blue to-jeopardy-blue-dark p-6 text-white shadow-2xl shadow-black/50">
        <h2 className="mb-5 font-jeopardy text-xl text-jeopardy-gold">Edit ${clue.value} Clue</h2>

        <label className="mb-3 block text-sm text-white/70">
          Clue text
          <textarea
            className={`mt-1 w-full ${inputBase}`}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label className="mb-3 block text-sm text-white/70">
          Image or video URL (optional)
          <input
            className={`mt-1 w-full ${inputBase}`}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (image, YouTube link, or .mp4)"
          />
        </label>

        <label className="mb-4 block text-sm text-white/70">
          Correct answer
          <input
            className={`mt-1 w-full ${inputBase}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </label>

        <div className="mb-4 text-sm text-white/70">
          Clue type
          <div className={`mt-1 inline-flex w-full gap-1 rounded-xl bg-white/5 p-1 ${isDailyDouble ? 'opacity-40' : ''}`}>
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
                    ? 'bg-jeopardy-gold text-jeopardy-blue-dark shadow-md'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isDailyDouble && (
            <p className="mt-1 text-xs text-white/40">Daily Doubles always use the wager flow.</p>
          )}
          {mode === 'host_control' && !isDailyDouble && (
            <p className="mt-1 text-xs text-white/40">
              No buzzers — you pick which player gets the money.
            </p>
          )}
        </div>

        <label className="mb-5 flex items-center justify-between text-sm text-white/70">
          Daily Double
          <button
            type="button"
            role="switch"
            aria-checked={isDailyDouble}
            onClick={() => setIsDailyDouble((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jeopardy-gold/60 ${
              isDailyDouble ? 'bg-jeopardy-gold' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
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
