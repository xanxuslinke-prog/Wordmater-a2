import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, X, RotateCcw, Trash2, Sparkles, Crown } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Right-side "Wordbook" pocket button.
 *
 * - Visual: looks like a stack of cards (5 pastel cards fanned slightly).
 *   On hover, the cards fan out wider, like a poker hand peek.
 * - Click opens a modal listing all mastered words as rainbow-shimmer cards.
 * - Each modal card flips to reveal Un-master / Delete actions.
 * - Exposes a `triggerCatch()` method (via ref) so Dashboard can play
 *   the "catching" animation when a card flies into the pocket.
 */
const WordbookButton = forwardRef(function WordbookButton(
  { masteredWords, onUnmaster, onDelete },
  ref
) {
  const [open, setOpen] = useState(false)
  const [catching, setCatching] = useState(false)
  const buttonRef = useRef(null)

  // Expose imperative handle for parent (Dashboard) to play catch animation
  useImperativeHandle(ref, () => ({
    triggerCatch() {
      setCatching(true)
      setTimeout(() => setCatching(false), 500)
    },
    getRect() {
      return buttonRef.current?.getBoundingClientRect()
    },
  }))

  // Preview cards on the deck (up to 5 most recent)
  const previewCards = masteredWords.slice(0, 5)
  const count = masteredWords.length

  // If nothing mastered, show 3 placeholder cards
  const stackPalettes = [
    'from-[#ffd0e8] to-[#ffe0c0]',
    'from-[#fff3b0] to-[#d4f0d4]',
    'from-[#c8edee] to-[#d4e4f7]',
    'from-[#d4e4f7] to-[#e8d5f5]',
    'from-[#e8d5f5] to-[#ffd0e8]',
  ]
  const stackCount = Math.max(3, Math.min(5, previewCards.length || 3))

  return (
    <>
      <motion.button
        ref={buttonRef}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setOpen(true)}
        className={`wordbook-deck card-pop !border-transparent w-full p-4 text-left bg-gradient-to-br from-white to-[color:var(--color-primary-light)] hover:shadow-lg transition relative ${catching ? 'wordbook-catching' : ''}`}
        style={{ minHeight: 120 }}
      >
        {/* Floating crown decoration (top-right of the whole button) */}
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 -right-2 z-10 pointer-events-none drop-shadow-md"
        >
          <Crown
            className="w-8 h-8 text-[color:var(--color-lemon-dark)]"
            strokeWidth={2.5}
            fill="#ffd97e"
          />
        </motion.div>

        {/* Deck preview (5 cards in default tight stack, fan out on hover) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-20" style={{ pointerEvents: 'none' }}>
          {Array.from({ length: stackCount }).map((_, i) => (
            <div
              key={i}
              className={`wordbook-card-stack bg-gradient-to-br ${stackPalettes[i % stackPalettes.length]}`}
              data-stack-index={i}
              style={{ zIndex: stackCount - i }}
            />
          ))}
        </div>

        {/* Label */}
        <div className="relative pr-24">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-[color:var(--color-primary)]" strokeWidth={3} />
            <span className="font-black text-lg text-[color:var(--color-ink)]">
              My Wordbook
            </span>
          </div>
          <p className="text-xs font-bold text-[color:var(--color-ink-soft)]">
            {count === 0
              ? 'No mastered words yet'
              : `${count} word${count > 1 ? 's' : ''} mastered`}
          </p>
          <p className="text-[10px] uppercase font-extrabold text-[color:var(--color-primary-dark)] mt-2">
            Tap to open ✨
          </p>
        </div>
      </motion.button>

      <WordbookModal
        open={open}
        onClose={() => setOpen(false)}
        words={masteredWords}
        onUnmaster={onUnmaster}
        onDelete={onDelete}
      />
    </>
  )
})

export default WordbookButton

// =============================================================
// Modal: list of all mastered words as rainbow shimmer cards
// =============================================================
function WordbookModal({ open, onClose, words, onUnmaster, onDelete }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-white rounded-3xl p-8 w-[95vw] max-w-[1400px] shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-[color:var(--color-ink)] flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[color:var(--color-primary)]" strokeWidth={3} />
                  My Wordbook
                </h2>
                <p className="text-sm font-bold text-[color:var(--color-ink-soft)] mt-0.5">
                  {words.length} word{words.length !== 1 ? 's' : ''} you've mastered ✨
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[color:var(--color-duo-cream)] hover:bg-[color:var(--color-line)] flex items-center justify-center transition"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {words.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📚</div>
                <p className="font-black text-lg text-[color:var(--color-ink)] mb-1">
                  Your wordbook is empty
                </p>
                <p className="text-sm font-bold text-[color:var(--color-ink-soft)]">
                  Master some words to start collecting!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {words.map((w, i) => (
                  <RainbowCard
                    key={w.id}
                    word={w}
                    index={i}
                    onUnmaster={onUnmaster}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// =============================================================
// Rainbow shimmer card (mastered word)
// =============================================================
function RainbowCard({ word, index, onUnmaster, onDelete }) {
  const [flipped, setFlipped] = useState(false)
  const [working, setWorking] = useState(false)

  async function handleUnmaster() {
    setWorking(true)
    try {
      await onUnmaster(word)
      toast.success(`"${word.word}" moved back to learning`)
    } catch {
      toast.error('Failed to un-master')
    } finally {
      setWorking(false)
    }
  }

  async function handleDelete() {
    setWorking(true)
    try {
      await onDelete(word.id)
      toast.success(`"${word.word}" deleted`)
    } catch {
      toast.error('Failed to delete')
    } finally {
      setWorking(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
      className={`word-card ${flipped ? 'flipped' : ''}`}
      style={{ width: '100%', height: 220 }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="word-card-inner">
        {/* FRONT - rainbow shimmer (with same border+shadow as back for alignment) */}
        <div
          className="word-card-face rainbow-card shadow-md"
          style={{ border: '2px solid transparent' }}
        >
          <div className="flex justify-between items-start relative z-10">
            <span className="text-xs uppercase font-extrabold text-[color:var(--color-ink)] bg-white/60 px-2 py-0.5 rounded-md">
              ✨ Mastered
            </span>
            <Sparkles className="w-4 h-4 text-[color:var(--color-primary-dark)]" strokeWidth={3} />
          </div>
          <div className="flex-1 flex items-center justify-center relative z-10">
            <h3 className="text-2xl font-black text-[color:var(--color-ink)] break-words text-center drop-shadow-sm">
              {word.word}
            </h3>
          </div>
          <div className="text-center relative z-10">
            <span className="text-[10px] uppercase font-extrabold text-[color:var(--color-ink)] bg-white/50 px-2 py-0.5 rounded-md">
              Tap to flip
            </span>
          </div>
        </div>

        {/* BACK - actions (no card-pop to avoid mismatched shadow offsetting layout) */}
        <div
          className="word-card-face word-card-back bg-white shadow-md"
          style={{ border: '2px solid transparent' }}
        >
          <div className="flex-1 flex flex-col justify-center text-center overflow-hidden">
            <p className="text-base font-black mb-1 text-[color:var(--color-primary-dark)]">
              {word.meaning}
            </p>
            {word.example && (
              <p className="text-xs text-[color:var(--color-ink-soft)] italic font-semibold">
                "{word.example}"
              </p>
            )}
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleUnmaster}
              disabled={working}
              className="btn-pop btn-ghost !py-1.5 !px-2 !text-[10px] flex-1"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={3} />
              Un-master
            </button>
            <button
              onClick={handleDelete}
              disabled={working}
              className="btn-pop btn-coral !py-1.5 !px-2 !text-[10px]"
            >
              <Trash2 className="w-3 h-3" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
