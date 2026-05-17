import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Reusable confirmation modal for destructive actions
 * (delete account, delete user, etc.)
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmStyle = 'coral', // 'coral' | 'primary'
  submitting = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[color:var(--color-pink-light)] flex items-center justify-center">
                  <AlertTriangle
                    className="w-5 h-5 text-[color:var(--color-coral-dark)]"
                    strokeWidth={3}
                  />
                </div>
                <h2 className="text-xl font-black text-[color:var(--color-ink)]">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[color:var(--color-duo-cream)] hover:bg-[color:var(--color-line)] flex items-center justify-center transition flex-shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>

            <p className="text-sm font-bold text-[color:var(--color-ink-soft)] mb-5 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="btn-pop btn-ghost flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`btn-pop ${confirmStyle === 'coral' ? 'btn-coral' : 'btn-primary'} flex-1`}
                disabled={submitting}
              >
                {submitting ? 'Working...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
