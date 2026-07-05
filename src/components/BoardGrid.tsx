import type { BoardMetaCategory } from '../types/game'

type Props = {
  categories: BoardMetaCategory[]
  onSelectClue?: (categoryIndex: number, clueIndex: number) => void
}

export function BoardGrid({ categories, onSelectClue }: Props) {
  return (
    <div className="grid grid-cols-6 gap-1.5 md:gap-2.5">
      {categories.map((cat, catIndex) => (
        <div key={catIndex} className="flex flex-col gap-1.5 md:gap-2.5">
          <div className="flex min-h-16 items-center justify-center rounded-xl bg-gradient-to-b from-jeopardy-blue-light to-jeopardy-blue p-1.5 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-md shadow-black/20 sm:text-xs md:text-sm">
            {cat.title || ' '}
          </div>
          {cat.clues.map((clue, clueIndex) => {
            const clickable = onSelectClue && clue.state === 'hidden'
            return (
              <button
                key={clueIndex}
                disabled={!clickable}
                onClick={() => onSelectClue?.(catIndex, clueIndex)}
                className={`flex aspect-[4/3] items-center justify-center rounded-xl font-jeopardy text-lg font-bold transition-all duration-200 sm:text-2xl md:text-3xl ${
                  clue.state === 'hidden'
                    ? 'bg-gradient-to-b from-jeopardy-blue to-jeopardy-blue-dark text-jeopardy-gold shadow-md shadow-black/20' +
                      (clickable
                        ? ' cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-jeopardy-gold/10 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jeopardy-gold/70'
                        : '')
                    : 'scale-95 bg-white/5 text-jeopardy-gold/10 shadow-inner shadow-black/20'
                }`}
              >
                {clue.state === 'hidden' ? `$${clue.value}` : ''}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
