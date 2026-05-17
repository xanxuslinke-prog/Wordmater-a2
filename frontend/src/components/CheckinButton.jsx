import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Calendar, Check, Sparkles, Flame, X, PartyPopper } from 'lucide-react'

import { api } from '../lib/api'

const WEEKDAY_RAINBOW = [
  { name: 'Sun', light: '#ffd0d0', solid: '#ff8a8a', dark: '#e76d6d' },
  { name: 'Mon', light: '#ffe0c0', solid: '#ffb070', dark: '#e8954a' },
  { name: 'Tue', light: '#fff3b0', solid: '#ffd97e', dark: '#f0c25e' },
  { name: 'Wed', light: '#d4f0d4', solid: '#9ed99e', dark: '#7bc77b' },
  { name: 'Thu', light: '#c8edee', solid: '#7ed4d7', dark: '#5fb6b9' },
  { name: 'Fri', light: '#d4e4f7', solid: '#9dcaef', dark: '#7ab1de' },
  { name: 'Sat', light: '#e8d5f5', solid: '#c5a8ff', dark: '#a285d8' },
]

/**
 * Two-part check-in widget:
 *   LEFT  : big "Check in today" button — does the actual check-in
 *           + triggers a confetti burst when it's a fresh check-in
 *   RIGHT : compact "View Calendar" button — only opens the calendar modal,
 *           never performs a check-in
 */
export default function CheckinButton() {
  const [data, setData] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function loadStatus() {
    try {
      const res = await api.get('/checkin')
      setData(res.data)
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function handleCheckIn() {
    if (submitting) return
    if (data?.checked_in_today) {
      // Already checked in — just open calendar instead
      setModalOpen(true)
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post('/checkin')
      setData(res.data)
      setModalOpen(true)
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 2000)
    } catch {
      toast.error('Check-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  const checkedToday = data?.checked_in_today
  const streak = data?.streak ?? 0
  const total = data?.total_days ?? 0

  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        {/* LEFT — main check-in action (Duolingo pop button style) */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleCheckIn}
          disabled={submitting}
          className={`btn-pop ${checkedToday ? 'btn-mint' : 'btn-primary'} !rounded-2xl !py-4 !px-5 !text-base !justify-start !text-left !normal-case !tracking-normal !uppercase-none w-full`}
          style={{ textTransform: 'none', letterSpacing: 'normal' }}
        >
          <div className="flex items-center gap-3 w-full">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              checkedToday ? 'bg-white/30' : 'bg-white/30'
            }`}>
              {checkedToday
                ? <Check className="w-6 h-6 text-white" strokeWidth={4} />
                : <Sparkles className="w-6 h-6 text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-black text-white leading-tight">
                {checkedToday ? "Checked in today! 🎉" : 'Check in today'}
              </div>
              <div className="text-xs font-bold text-white/90 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" strokeWidth={3} />
                  {streak}-day streak
                </span>
                <span>·</span>
                <span>{total} total</span>
              </div>
            </div>
          </div>
        </motion.button>

        {/* RIGHT — view calendar (matching pop button style) */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          onClick={() => setModalOpen(true)}
          className="btn-pop btn-primary !rounded-2xl !py-4 !px-5 !text-sm flex-col gap-1 min-w-[110px]"
          style={{ textTransform: 'none', letterSpacing: 'normal' }}
        >
          <Calendar className="w-7 h-7 text-white" strokeWidth={3} />
          <span className="text-xs font-black text-white">
            View Calendar
          </span>
        </motion.button>
      </div>

      <CheckinModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={data}
        celebrating={celebrating}
      />
    </>
  )
}

// =============================================================
// Modal
// =============================================================
function CheckinModal({ open, onClose, data, celebrating }) {
  const calendar = useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startWeekday = firstDay.getDay()
    const checkedSet = new Set(data?.all_dates || [])

    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dt = new Date(year, month, d)
      cells.push({
        day: d,
        iso,
        weekday: dt.getDay(),
        checked: checkedSet.has(iso),
        isToday: d === today.getDate(),
      })
    }
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    return { cells, monthName }
  }, [data])

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
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 22 }}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence>
              {celebrating && <CelebrationBurst />}
            </AnimatePresence>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-black text-[color:var(--color-ink)] flex items-center gap-2">
                  {celebrating && <PartyPopper className="w-6 h-6 text-[color:var(--color-pink-dark)]" strokeWidth={3} />}
                  {celebrating ? 'Checked In!' : 'Your Check-ins'}
                </h2>
                <p className="text-sm font-bold text-[color:var(--color-ink-soft)] mt-0.5">
                  {calendar.monthName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[color:var(--color-duo-cream)] hover:bg-[color:var(--color-line)] flex items-center justify-center transition"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="card-pop !border-transparent bg-gradient-to-br from-[#ffe0c0] to-[#fff3b0] p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6 text-[color:var(--color-peach-dark)]" strokeWidth={3} />
                  <span className="text-3xl font-black text-[color:var(--color-peach-dark)]">
                    {data?.streak ?? 0}
                  </span>
                </div>
                <div className="text-[11px] uppercase font-extrabold text-[color:var(--color-ink-soft)] mt-1">
                  Day streak
                </div>
              </div>
              <div className="card-pop !border-transparent bg-gradient-to-br from-[#e8d5f5] to-[#d4e4f7] p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-[color:var(--color-primary-dark)]" strokeWidth={3} />
                  <span className="text-3xl font-black text-[color:var(--color-primary-dark)]">
                    {data?.total_days ?? 0}
                  </span>
                </div>
                <div className="text-[11px] uppercase font-extrabold text-[color:var(--color-ink-soft)] mt-1">
                  Total days
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAY_RAINBOW.map((wd, i) => (
                <div
                  key={i}
                  className="text-center text-xs uppercase font-black py-1 rounded-md"
                  style={{ color: wd.dark, background: wd.light }}
                >
                  {wd.name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendar.cells.map((cell, i) => {
                if (cell === null) return <div key={i} className="aspect-square" />
                const rainbow = WEEKDAY_RAINBOW[cell.weekday]
                return (
                  <motion.div
                    key={cell.iso}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.008 }}
                    className={`aspect-square rounded-xl flex items-center justify-center relative font-black text-base
                      ${cell.isToday ? 'ring-2 ring-offset-2 ring-[color:var(--color-primary)]' : ''}
                    `}
                    style={
                      cell.checked
                        ? {
                            background: `linear-gradient(135deg, ${rainbow.solid} 0%, ${rainbow.dark} 100%)`,
                            color: 'white',
                            boxShadow: `0 3px 0 ${rainbow.dark}`,
                          }
                        : {
                            background: '#f3eff5',
                            color: '#c4b8d1',
                          }
                    }
                  >
                    {cell.day}
                    {cell.checked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.008 + 0.1, type: 'spring' }}
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm"
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: rainbow.dark }} strokeWidth={5} />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            <p className="text-center text-xs font-bold text-[color:var(--color-ink-soft)] mt-4">
              Each weekday has its own rainbow color 🌈
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CelebrationBurst() {
  const particles = useMemo(() => {
    const colors = ['#ff8a8a', '#ffb070', '#ffd97e', '#9ed99e', '#7ed4d7', '#9dcaef', '#c5a8ff']
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      angle: (i / 28) * Math.PI * 2 + Math.random() * 0.3,
      distance: 130 + Math.random() * 90,
      delay: Math.random() * 0.15,
      duration: 0.9 + Math.random() * 0.4,
      size: 8 + Math.random() * 10,
    }))
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      <div className="absolute top-1/2 left-1/2 w-0 h-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(p.angle) * p.distance,
              y: Math.sin(p.angle) * p.distance,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.5],
              rotate: 360,
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              left: -p.size / 2,
              top: -p.size / 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
