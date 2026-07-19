import { boardCategoryHeader, boardClueTile } from '../lib/uiClasses'
import type { BoardMetaCategory } from '../types/game'

type Props = {
  categories: BoardMetaCategory[]
  onSelectClue?: (categoryIndex: number, clueIndex: number) => void
}

export function BoardGrid({ categories, onSelectClue }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2 md:gap-3">
      {categories.map((cat, catIndex) => (
        <div key={catIndex} className="flex flex-col gap-2 md:gap-3">
          <div className={boardCategoryHeader}>{cat.title || ' '}</div>
          {cat.clues.map((clue, clueIndex) => {
            const clickable = onSelectClue && clue.state === 'hidden'
            return (
              <button
                key={clueIndex}
                disabled={!clickable}
                onClick={() => onSelectClue?.(catIndex, clueIndex)}
                className={`${boardClueTile} ${
                  clue.state === 'hidden'
                    ? 'bg-gradient-to-b from-crt-bg-light to-crt-bg text-crt-amber-light shadow-md shadow-black/20' +
                      (clickable
                        ? ' cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-crt-amber/10 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-amber/70'
                        : '')
                    : 'scale-95 bg-crt-cream/5 text-crt-amber/10 shadow-inner shadow-black/20'
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
