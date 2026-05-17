import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Shield, BookOpen, User, Trash2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import { api } from '../lib/api'
import ConfirmDialog from './ConfirmDialog'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  const username = localStorage.getItem('username') || 'user'

  const [menuOpen, setMenuOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  function clearAuthAndGoHome() {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('is_admin')
    localStorage.removeItem('username')
    navigate('/')
  }

  function logout() {
    setMenuOpen(false)
    clearAuthAndGoHome()
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      await api.delete('/account')
      toast.success('Account deleted. Goodbye! 👋')
      setShowConfirm(false)
      clearAuthAndGoHome()
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold uppercase text-sm transition ${
      location.pathname === path
        ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary-dark)]'
        : 'text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-duo-cream)]'
    }`

  return (
    <>
      <nav className="bg-white border-b-2 border-[color:var(--color-line)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[color:var(--color-primary)] flex items-center justify-center shadow-[0_3px_0_var(--color-primary-dark)] group-hover:translate-y-[1px] group-hover:shadow-[0_2px_0_var(--color-primary-dark)] transition-all">
              <BookOpen className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#f37cab] via-[#b794e8] to-[#9dcaef] bg-clip-text text-transparent">
              WordMaster
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className={linkClass('/admin')}>
                <Shield className="w-4 h-4" strokeWidth={3} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[color:var(--color-primary-light)] hover:bg-[#e0c7ff] transition"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[color:var(--color-pink)] to-[color:var(--color-primary)] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="hidden sm:inline font-extrabold text-sm text-[color:var(--color-primary-dark)] max-w-[100px] truncate">
                  {username}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[color:var(--color-primary-dark)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  strokeWidth={3}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 card-pop bg-white p-2 shadow-xl"
                  >
                    <div className="px-3 py-2 border-b-2 border-[color:var(--color-line)] mb-1">
                      <div className="text-[10px] uppercase font-black text-[color:var(--color-ink-soft)]">
                        Signed in as
                      </div>
                      <div className="font-black text-sm text-[color:var(--color-ink)] truncate">
                        {username}
                      </div>
                    </div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[color:var(--color-duo-cream)] font-bold text-sm text-[color:var(--color-ink)] transition"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={3} />
                      Log out
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        setShowConfirm(true)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[color:var(--color-pink-light)] font-bold text-sm text-[color:var(--color-coral-dark)] transition"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={3} />
                      Delete account
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={deleteAccount}
        title="Delete Account?"
        message="This will permanently delete your account, all your words, learning history, and check-ins. This action cannot be undone."
        confirmLabel="Yes, delete"
        confirmStyle="coral"
        submitting={deleting}
      />
    </>
  )
}
