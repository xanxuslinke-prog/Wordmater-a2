import { useState, useRef, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Check, RotateCw } from 'lucide-react'

function SparkleIcon({ color = '#ffb3d9' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 1 L13.8 9.2 L22 11 L13.8 12.8 L12 21 L10.2 12.8 L2 11 L10.2 9.2 Z"
        fill={color}
      />
    </svg>
  )
}

// 12 sparkles placed around the card's edge (not center).
// Each one bursts further outward when the card flips.
const SPARKLE_POSITIONS = [
  // Top edge
  { top: '-10px', left: '20%', dx: '0px', dy: '-40px', color: '#ffb3d9', delay: 0 },
  { top: '-10px', left: '50%', dx: '0px', dy: '-50px', color: '#c5a8ff', delay: 0.05 },
  { top: '-10px', left: '80%', dx: '0px', dy: '-40px', color: '#a8e6cf', delay: 0.1 },
  // Right edge
  { top: '25%', right: '-10px', dx: '50px', dy: '0px', color: '#ffd3a5', delay: 0.03 },
  { top: '75%', right: '-10px', dx: '40px', dy: '0px', color: '#9dcaef', delay: 0.08 },
  // Bottom edge
  { bottom: '-10px', left: '80%', dx: '0px', dy: '40px', color: '#ffb3d9', delay: 0.06 },
  { bottom: '-10px', left: '50%', dx: '0px', dy: '50px', color: '#c5a8ff', delay: 0.02 },
  { bottom: '-10px', left: '20%', dx: '0px', dy: '40px', color: '#a8e6cf', delay: 0.09 },
  // Left edge
  { top: '75%', left: '-10px', dx: '-40px', dy: '0px', color: '#ffd3a5', delay: 0.04 },
  { top: '25%', left: '-10px', dx: '-50px', dy: '0px', color: '#9dcaef', delay: 0.07 },
  // Diagonal corners (extra splash)
  { top: '-12px', left: '-12px', dx: '-30px', dy: '-30px', color: '#ffb3d9', delay: 0.11 },
  { bottom: '-12px', right: '-12px', dx: '30px', dy: '30px', color: '#c5a8ff', delay: 0.12 },
]

const WordCard = forwardRef(function WordCard(
  {
    word,
    onDelete,
    onLearned,
    index = 0,
    selectMode = false,
    selected = false,
    onToggleSelect,
  },
  ref
) {
  const [flipped, setFlipped] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const flipTimeoutRef = useRef(null)

  const palettes = [
    { bg: 'bg-[color:var(--color-sky-light)]', accent: 'text-[color:var(--color-sky-dark)]' },
    { bg: 'bg-[color:var(--color-pink-light)]', accent: 'text-[color:var(--color-pink-dark)]' },
    { bg: 'bg-[color:var(--color-mint-light)]', accent: 'text-[color:var(--color-mint-dark)]' },
    { bg: 'bg-[color:var(--color-peach-light)]', accent: 'text-[color:var(--color-peach-dark)]' },
    { bg: 'bg-[color:var(--color-primary-light)]', accent: 'text-[color:var(--color-primary-dark)]' },
  ]
  const palette = palettes[index % palettes.length]

  function handleClick() {
    if (selectMode) {
      onToggleSelect?.(word.id)
      return
    }
    setFlipping(true)
    setFlipped((f) => !f)
    clearTimeout(flipTimeoutRef.current)
    flipTimeoutRef.current = setTimeout(() => setFlipping(false), 900)
  }

  return (
    <motion.div
      ref={ref}
      data-word-id={word.id}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.4,
        transition: { duration: 0.35 },
      }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className={`word-card ${flipped ? 'flipped' : ''} ${flipping ? 'flipping' : ''}`}
      style={{ width: '100%', height: 220 }}
      onClick={handleClick}
    >
      {/* Rainbow halo on flip */}
      <div className="word-card-glow" />

      {/* Sparkle burst from card edges */}
      {SPARKLE_POSITIONS.map((pos, i) => (
        <div
          key={i}
          className="sparkle"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            bottom: pos.bottom,
            '--dx': pos.dx,
            '--dy': pos.dy,
            animationDelay: `${pos.delay}s`,
          }}
        >
          <SparkleIcon color={pos.color} />
        </div>
      ))}

      <div className="word-card-inner">
        {/* FRONT */}
        <div className={`word-card-face card-pop ${palette.bg} !border-transparent relative`}>
          {/* Selection checkbox (only in select mode) */}
          {selectMode && (
            <div
              className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center border-2 transition z-10 ${
                selected
                  ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary-dark)]'
                  : 'bg-white/80 border-[color:var(--color-line)]'
              }`}
            >
              {selected && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
            </div>
          )}

          <div className="flex justify-between items-start">
            <span className={`text-xs uppercase font-extrabold ${palette.accent} ${selectMode ? 'ml-9' : ''}`}>
              {selectMode ? (selected ? 'Selected' : 'Tap to select') : 'Tap to flip'}
            </span>
            {!selectMode && (
              <RotateCw className={`w-4 h-4 ${palette.accent}`} strokeWidth={3} />
            )}
          </div>

          <div className="flex-1 flex items-center justify-center">
            <h2 className="text-3xl font-black text-[color:var(--color-ink)] break-words text-center">
              {word.word}
            </h2>
          </div>

          {!selectMode && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onLearned(word)}
                className="btn-pop btn-mint !py-2 !px-3 !text-xs flex-1"
                title="Mark as learned"
              >
                <Check className="w-4 h-4" strokeWidth={4} />
                Learned
              </button>
              <button
                onClick={() => onDelete(word.id)}
                className="btn-pop btn-coral !py-2 !px-3 !text-xs"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        {/* BACK */}
        <div className="word-card-face word-card-back card-pop bg-white">
          <div className="flex-1 flex flex-col justify-center text-center overflow-hidden">
            <p className={`text-lg font-black mb-2 ${palette.accent}`}>{word.meaning}</p>
            {word.example && (
              <p className="text-sm text-[color:var(--color-ink-soft)] italic font-semibold">
                "{word.example}"
              </p>
            )}
          </div>
          <div className="text-center">
            <span className="text-xs uppercase font-extrabold text-[color:var(--color-ink-soft)]">
              Tap to flip back
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default WordCard
