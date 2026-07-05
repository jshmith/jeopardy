import type { CurrentClue } from '../types/game'

type Props = {
  clue: CurrentClue
}

export function ClueDisplay({ clue }: Props) {
  return (
    <div className="animate-clue-in relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-jeopardy-blue to-jeopardy-blue-dark p-8 text-center shadow-2xl shadow-black/40 md:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 60%)' }}
      />
      <p className="relative font-jeopardy text-2xl leading-snug text-white md:text-4xl">{clue.text}</p>
      {clue.imageUrl && (
        <img
          src={clue.imageUrl}
          alt=""
          className="relative max-h-80 max-w-full rounded-xl object-contain shadow-lg"
        />
      )}
      {clue.revealedAnswer && (
        <p className="animate-fade-in-up relative font-jeopardy text-xl text-jeopardy-gold md:text-2xl">
          {clue.revealedAnswer}
        </p>
      )}
    </div>
  )
}
