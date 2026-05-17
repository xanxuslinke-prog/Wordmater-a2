import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, color = 'green' }) {
  const colorMap = {
    green: {
      bg: 'bg-[color:var(--color-primary-light)]',
      text: 'text-[color:var(--color-primary-dark)]',
      iconBg: 'bg-[color:var(--color-primary)]',
    },
    blue: {
      bg: 'bg-[color:var(--color-sky-light)]',
      text: 'text-[color:var(--color-sky-dark)]',
      iconBg: 'bg-[color:var(--color-sky)]',
    },
    yellow: {
      bg: 'bg-[color:var(--color-peach-light)]',
      text: 'text-[color:var(--color-peach-dark)]',
      iconBg: 'bg-[color:var(--color-peach)]',
    },
    purple: {
      bg: 'bg-[color:var(--color-pink-light)]',
      text: 'text-[color:var(--color-pink-dark)]',
      iconBg: 'bg-[color:var(--color-pink)]',
    },
    mint: {
      bg: 'bg-[color:var(--color-mint-light)]',
      text: 'text-[color:var(--color-mint-dark)]',
      iconBg: 'bg-[color:var(--color-mint)]',
    },
  }
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card-pop p-4 flex items-center gap-3 ${c.bg} !border-transparent`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" strokeWidth={3} />
      </div>
      <div className="text-left">
        <div className={`text-2xl font-black ${c.text}`}>{value}</div>
        <div className="text-xs uppercase font-extrabold text-[color:var(--color-ink-soft)]">
          {label}
        </div>
      </div>
    </motion.div>
  )
}
