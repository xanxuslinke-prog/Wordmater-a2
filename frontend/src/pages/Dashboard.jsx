import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Plus, BookMarked, Trophy, Flame, BookOpen as BookIcon, MousePointerClick, X, Check } from 'lucide-react'

import { api } from '../lib/api'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import WordCard from '../components/WordCard'
import AddWordModal from '../components/AddWordModal'
import Mascot from '../components/Mascot'
import CheckinButton from '../components/CheckinButton'
import WordbookButton from '../components/WordbookButton'

export default function Dashboard() {
  const [words, setWords] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // Selection mode
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Refs for fly-to-pocket animation
  const cardRefs = useRef({})
  const wordbookRef = useRef(null)
  const [flyingCards, setFlyingCards] = useState([]) // [{ id, word, startRect }]

  const username = localStorage.getItem('username') || 'friend'

  async function loadWords() {
    try {
      const res = await api.get('/words')
      setWords(res.data)
    } catch {
      toast.error('Failed to load words')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWords()
  }, [])

  async function handleAdd(payload) {
    await api.post('/words', payload)
    loadWords()
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/words/${id}`)
      setWords((prev) => prev.filter((w) => w.id !== id))
      toast.success('Word deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  /**
   * Master a word (or many): fire the fly-to-pocket animation, then PUT to
   * backend, then remove from learning list.
   */
  async function masterWords(wordsToMaster) {
    if (wordsToMaster.length === 0) return

    // 1. Snapshot card positions before they animate away
    const flying = wordsToMaster
      .map((w) => {
        const el = cardRefs.current[w.id]
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return { id: w.id, word: w, startRect: rect }
      })
      .filter(Boolean)

    setFlyingCards(flying)

    // 2. Optimistically remove from learning list so cards animate out
    setWords((prev) =>
      prev.map((w) =>
        wordsToMaster.find((m) => m.id === w.id)
          ? { ...w, learned: true }
          : w
      )
    )

    // 3. Trigger wordbook catch animation when cards arrive (~85% of duration)
    setTimeout(() => {
      wordbookRef.current?.triggerCatch()
    }, 700 + wordsToMaster.length * 80)

    // 4. Clear flying cards after animation
    setTimeout(() => setFlyingCards([]), 1100 + wordsToMaster.length * 80)

    // 5. Fire backend updates in parallel
    try {
      await Promise.all(
        wordsToMaster.map((w) =>
          api.put(`/words/${w.id}`, { ...w, learned: true })
        )
      )
      if (wordsToMaster.length === 1) {
        toast.success(`"${wordsToMaster[0].word}" mastered! ✨`)
      } else {
        toast.success(`${wordsToMaster.length} words mastered! 🎉`)
      }
    } catch {
      toast.error('Some words failed to save')
      loadWords()
    }
  }

  async function handleLearned(word) {
    await masterWords([word])
  }

  async function handleUnmaster(word) {
    await api.put(`/words/${word.id}`, { ...word, learned: false })
    setWords((prev) =>
      prev.map((w) => (w.id === word.id ? { ...w, learned: false } : w))
    )
  }

  // Selection helpers
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function masterSelected() {
    const toMaster = words.filter((w) => selectedIds.has(w.id) && !w.learned)
    exitSelectMode()
    await masterWords(toMaster)
  }

  // ----- Derived state -----
  const learningWords = useMemo(() => words.filter((w) => !w.learned), [words])
  const masteredWords = useMemo(() => words.filter((w) => w.learned), [words])

  const stats = useMemo(() => {
    const total = words.length
    const learned = masteredWords.length
    const learning = learningWords.length
    const progress = total ? Math.round((learned / total) * 100) : 0
    return { total, learned, learning, progress }
  }, [words, masteredWords, learningWords])

  const visible = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return learningWords
    return learningWords.filter(
      (w) =>
        w.word.toLowerCase().includes(s) ||
        w.meaning.toLowerCase().includes(s)
    )
  }, [learningWords, search])

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-black mb-1">
            Hey, {username}! 👋
          </h1>
          <p className="text-[color:var(--color-ink-soft)] font-bold">
            Ready to master some new words today?
          </p>
        </motion.div>

        {/* Top row: Check-in (left, wider) + Wordbook (right) */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 mb-6">
          <CheckinButton />
          <WordbookButton
            ref={wordbookRef}
            masteredWords={masteredWords}
            onUnmaster={handleUnmaster}
            onDelete={handleDelete}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={BookIcon} label="Total" value={stats.total} color="blue" />
          <StatCard icon={BookMarked} label="Learning" value={stats.learning} color="yellow" />
          <StatCard icon={Trophy} label="Mastered" value={stats.learned} color="mint" />
          <StatCard icon={Flame} label="Progress" value={`${stats.progress}%`} color="purple" />
        </div>

        {/* Controls row */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--color-ink-soft)]"
              strokeWidth={3}
            />
            <input
              className="input-pop !pl-10"
              placeholder="Search words or meanings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={selectMode}
            />
          </div>

          {!selectMode ? (
            <>
              <button
                onClick={() => setSelectMode(true)}
                className="btn-pop btn-ghost"
                disabled={learningWords.length === 0}
                title="Pick multiple words to master at once"
              >
                <MousePointerClick className="w-5 h-5" strokeWidth={3} />
                Select
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-pop btn-primary">
                <Plus className="w-5 h-5" strokeWidth={4} />
                Add Word
              </button>
            </>
          ) : (
            <>
              <button onClick={exitSelectMode} className="btn-pop btn-ghost">
                <X className="w-5 h-5" strokeWidth={3} />
                Cancel
              </button>
              <button
                onClick={masterSelected}
                className="btn-pop btn-mint"
                disabled={selectedIds.size === 0}
              >
                <Check className="w-5 h-5" strokeWidth={4} />
                Master Selected ({selectedIds.size})
              </button>
            </>
          )}
        </div>

        {/* Selection-mode hint banner */}
        <AnimatePresence>
          {selectMode && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-[color:var(--color-primary-light)] text-[color:var(--color-primary-dark)] rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 overflow-hidden"
            >
              <MousePointerClick className="w-5 h-5" strokeWidth={3} />
              Tap cards to select them, then hit "Master Selected" to send them all to your wordbook ✨
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-pop h-[220px] bg-white animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Mascot size={160} />
            <h3 className="text-2xl font-black mt-4 mb-2">
              {learningWords.length === 0 ? 'All caught up! 🎉' : 'Nothing matches'}
            </h3>
            <p className="text-[color:var(--color-ink-soft)] font-bold mb-5 max-w-sm">
              {learningWords.length === 0
                ? words.length === 0
                  ? 'Add your first word to start your learning journey!'
                  : 'You\'ve mastered every word. Add more, or check your wordbook!'
                : 'Try a different search term.'}
            </p>
            {learningWords.length === 0 && (
              <button onClick={() => setShowAdd(true)} className="btn-pop btn-primary">
                <Plus className="w-5 h-5" strokeWidth={4} />
                Add a Word
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {visible.map((w, i) => (
                <WordCard
                  ref={(el) => {
                    if (el) cardRefs.current[w.id] = el
                    else delete cardRefs.current[w.id]
                  }}
                  key={w.id}
                  word={w}
                  index={i}
                  onDelete={handleDelete}
                  onLearned={handleLearned}
                  selectMode={selectMode}
                  selected={selectedIds.has(w.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddWordModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
      />

      {/* Cards flying to the wordbook */}
      <FlyingCardsOverlay
        cards={flyingCards}
        getTargetRect={() => wordbookRef.current?.getRect()}
      />
    </div>
  )
}

/**
 * Renders portal-style overlay cards that animate from each card's last
 * position to the wordbook pocket's screen position.
 */
function FlyingCardsOverlay({ cards, getTargetRect }) {
  if (cards.length === 0) return null
  const target = getTargetRect?.()
  if (!target) return null

  // Target center (where cards should land)
  const tx = target.left + target.width / 2
  const ty = target.top + target.height / 2

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cards.map((c, idx) => {
        const { startRect } = c
        const sx = startRect.left + startRect.width / 2
        const sy = startRect.top + startRect.height / 2
        const dx = tx - sx
        const dy = ty - sy

        // Arc midpoint — peaks above the straight line between start and target
        const midX = startRect.left + dx * 0.5
        const midY = startRect.top + dy * 0.5 - 80 // arc upward 80px

        return (
          <motion.div
            key={c.id}
            initial={{
              left: startRect.left,
              top: startRect.top,
              width: startRect.width,
              height: startRect.height,
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            animate={{
              left: [startRect.left, midX, startRect.left + dx],
              top: [startRect.top, midY, startRect.top + dy],
              width: [startRect.width, startRect.width * 0.5, 36],
              height: [startRect.height, startRect.height * 0.5, 48],
              rotate: [0, idx % 2 === 0 ? -180 : 180, idx % 2 === 0 ? -360 : 360],
              scale: [1, 0.6, 0.3],
              opacity: [1, 1, 0.9, 0],
            }}
            transition={{
              duration: 1.0,
              delay: idx * 0.08,
              ease: [0.4, 0, 0.4, 1],
              opacity: { times: [0, 0.6, 0.85, 1], duration: 1.0 },
              times: [0, 0.5, 1],
            }}
            className="rainbow-card absolute rounded-2xl shadow-2xl flex items-center justify-center"
            style={{ position: 'fixed' }}
          >
            <span className="font-black text-sm text-[color:var(--color-ink)] relative z-10 px-1 truncate">
              {c.word.word}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
