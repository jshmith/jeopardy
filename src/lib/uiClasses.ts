/** Shared class strings so buttons/inputs/cards look consistent across every screen. */

export const btnPrimary =
  'rounded-xl bg-gradient-to-b from-crt-amber-light to-crt-amber px-5 py-2.5 font-semibold text-crt-bg shadow-md shadow-black/20 transition duration-150 hover:brightness-105 hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-amber/70 focus-visible:ring-offset-2 focus-visible:ring-offset-crt-bg'

export const btnSecondary =
  'rounded-xl bg-crt-cream/10 px-5 py-2.5 font-semibold text-crt-cream shadow-sm transition duration-150 hover:bg-crt-cream/15 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-cream/40 focus-visible:ring-offset-2 focus-visible:ring-offset-crt-bg'

export const btnQuiet =
  'rounded-lg px-3 py-1.5 text-sm text-crt-cream/60 transition duration-150 hover:bg-crt-cream/10 hover:text-crt-cream/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-cream/30'

export const btnDanger =
  'rounded-xl bg-red-600/90 px-5 py-2.5 font-semibold text-white shadow-md shadow-black/20 transition duration-150 hover:bg-red-600 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70'

export const btnCorrect =
  'rounded-xl bg-gradient-to-b from-green-500 to-green-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-black/20 transition duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300/60'

export const btnIncorrect =
  'rounded-xl bg-gradient-to-b from-red-500 to-red-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-black/20 transition duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60'

export const inputBase =
  'rounded-lg border border-crt-cream/10 bg-crt-cream/5 px-3 py-2.5 text-crt-cream placeholder:text-crt-cream/30 shadow-inner shadow-black/10 transition duration-150 focus:border-transparent focus:bg-crt-cream/10 focus:outline-none focus:ring-2 focus:ring-crt-amber/60'

export const card =
  'rounded-2xl border border-crt-cream/10 bg-gradient-to-b from-crt-bg-light to-crt-bg shadow-xl shadow-black/30'

export const cardHover =
  'transition duration-150 hover:-translate-y-0.5 hover:shadow-2xl hover:border-crt-cream/20'

/** Shared sizing so the board editor's grid always matches the live board's
 * scale exactly, instead of drifting apart via hand-tuned breakpoints. */
export const boardCategoryHeader =
  'flex min-h-24 items-center justify-center rounded-xl bg-gradient-to-b from-crt-plum-light to-crt-plum p-2 text-center text-sm font-bold uppercase leading-tight tracking-wide text-crt-cream shadow-md shadow-black/20 sm:text-base md:text-lg'

export const boardCategoryInput =
  'w-full rounded-xl border border-crt-cream/10 bg-crt-surface/60 p-3 text-center text-sm font-bold uppercase tracking-wide text-crt-cream placeholder:text-crt-cream/30 shadow-inner shadow-black/10 transition duration-150 focus:border-transparent focus:bg-crt-cream/10 focus:outline-none focus:ring-2 focus:ring-crt-amber/60 sm:p-4 sm:text-base md:p-5 md:text-lg'

export const boardClueTile =
  'flex aspect-[4/3] items-center justify-center rounded-xl font-jeopardy text-2xl font-bold transition-all duration-200 sm:text-4xl md:text-5xl'
