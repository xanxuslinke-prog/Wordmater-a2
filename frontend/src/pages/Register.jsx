import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'

import { api } from '../lib/api'
import Mascot from '../components/Mascot'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function register() {
    if (!username || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.post('/register', { username, password })
      toast.success('Account created! Please log in. 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') register()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 grid md:grid-cols-2 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden md:flex flex-col items-center justify-center p-10"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Mascot size={220} />
          </motion.div>
          <h1 className="text-4xl font-black mt-6 text-center bg-gradient-to-r from-[#f37cab] via-[#b794e8] to-[#9dcaef] bg-clip-text text-transparent">
            Join WordMaster!
          </h1>
          <p className="text-lg font-bold text-[color:var(--color-ink-soft)] mt-2 text-center max-w-sm">
            Free, fun, and proven to grow your vocabulary 🦄
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center p-6 md:p-10"
        >
          <div className="w-full max-w-sm">
            <div className="md:hidden flex flex-col items-center mb-6">
              <Mascot size={120} />
              <h1 className="text-3xl font-black mt-3 bg-gradient-to-r from-[#f37cab] via-[#b794e8] to-[#9dcaef] bg-clip-text text-transparent">
                WordMaster
              </h1>
            </div>

            <h2 className="text-3xl font-black mb-1">Create account</h2>
            <p className="text-[color:var(--color-ink-soft)] font-bold mb-6">
              Start your learning journey.
            </p>

            <div className="space-y-3 mb-5">
              <input
                className="input-pop"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKey}
                autoFocus
              />
              <input
                className="input-pop"
                type="password"
                placeholder="Password (min. 4 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
              />
              <input
                className="input-pop"
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={onKey}
              />
            </div>

            <button
              onClick={register}
              disabled={loading}
              className="btn-pop btn-primary w-full mb-4"
            >
              <UserPlus className="w-5 h-5" strokeWidth={4} />
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <p className="text-center text-sm font-bold text-[color:var(--color-ink-soft)]">
              Already have an account?{' '}
              <Link
                to="/"
                className="text-[color:var(--color-sky)] hover:underline font-black uppercase"
              >
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
