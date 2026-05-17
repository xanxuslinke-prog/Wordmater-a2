import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function AddWordModal({ open, onClose, onSubmit }) {
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setWord('')
      setMeaning('')
      setExample('')
    }
  }, [open])

  async function handleSubmit() {
    if (!word.trim() || !meaning.trim()) {
      toast.error('Word and meaning are required')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ word: word.trim(), meaning: meaning.trim(), example: example.trim() })
      toast.success('Word added! 🎉')
      onClose()
    } catch {
      toast.error('Failed to add word')
    } finally {
      setSubmitting(false)
    }
  }

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
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-black text-[color:var(--color-ink)]">
                Add a New Word
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[color:var(--color-duo-cream)] hover:bg-[color:var(--color-line)] flex items-center justify-center transition"
              >
                <X className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs uppercase font-extrabold text-[color:var(--color-ink-soft)] mb-1.5">
                  Word *
                </label>
                <input
                  className="input-pop"
                  placeholder="e.g. serendipity"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-extrabold text-[color:var(--color-ink-soft)] mb-1.5">
                  Meaning *
                </label>
                <input
                  className="input-pop"
                  placeholder="e.g. 意外的惊喜发现"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-extrabold text-[color:var(--color-ink-soft)] mb-1.5">
                  Example sentence
                </label>
                <input
                  className="input-pop"
                  placeholder="e.g. Meeting her was pure serendipity."
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-pop btn-primary w-full"
            >
              <Plus className="w-5 h-5" strokeWidth={4} />
              {submitting ? 'Adding...' : 'Add Word'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
