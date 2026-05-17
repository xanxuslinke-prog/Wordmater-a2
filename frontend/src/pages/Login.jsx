import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { LogIn } from 'lucide-react'

import { api } from '../lib/api'
import Mascot from '../components/Mascot'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    if (!username || !password) {
      toast.error('Please enter username and password')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/login', { username, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('refresh_token', res.data.refresh_token)
      localStorage.setItem('is_admin', res.data.is_admin)
      localStorage.setItem('username', res.data.username)
      toast.success(`Welcome back, ${res.data.username}! 🦄`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') login()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 grid md:grid-cols-2 max-w-6xl mx-auto w-full">
        {/* Left: brand + mascot */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden md:flex flex-col items-center justify-center p-10"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Mascot size={220} />
          </motion.div>
          <h1 className="text-5xl font-black mt-6 text-center bg-gradient-to-r from-[#f37cab] via-[#b794e8] to-[#9dcaef] bg-clip-text text-transparent">
            WordMaster
          </h1>
          <p className="text-lg font-bold text-[color:var(--color-ink-soft)] mt-2 text-center max-w-sm">
            Learn vocabulary the magical way ✨
          </p>
        </motion.div>

        {/* Right: form */}
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

            <h2 className="text-3xl font-black mb-1">Welcome back!</h2>
            <p className="text-[color:var(--color-ink-soft)] font-bold mb-6">
              Log in to keep learning.
            </p>

            <div className="space-y-3 mb-5">
              <input
                className="input-pop"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKey}
                autoFocus
              />
              <input
                className="input-pop"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
              />
            </div>

            <button
              onClick={login}
              disabled={loading}
              className="btn-pop btn-primary w-full mb-4"
            >
              <LogIn className="w-5 h-5" strokeWidth={4} />
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <p className="text-center text-sm font-bold text-[color:var(--color-ink-soft)]">
              No account?{' '}
              <Link
                to="/register"
                className="text-[color:var(--color-sky)] hover:underline font-black uppercase"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
