import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Activity, Users, FileText, Trash2, ShieldCheck } from 'lucide-react'

import { api } from '../lib/api'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import ConfirmDialog from '../components/ConfirmDialog'

const actionColors = {
  added: 'bg-[color:var(--color-mint-light)] text-[color:var(--color-mint-dark)]',
  updated: 'bg-[color:var(--color-sky-light)] text-[color:var(--color-sky-dark)]',
  deleted: 'bg-[color:var(--color-pink-light)] text-[color:var(--color-coral-dark)]',
}

export default function Admin() {
  const [history, setHistory] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('users') // 'users' | 'history'

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function loadAll() {
    try {
      const [hRes, uRes] = await Promise.all([
        api.get('/admin/history'),
        api.get('/admin/users'),
      ])
      setHistory(hRes.data)
      setUsers(uRes.data)
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required')
      } else {
        toast.error('Failed to load admin data')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function confirmDeleteUser() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.delete(`/admin/users/${pendingDelete.id}`)
      toast.success(`Deleted user "${pendingDelete.username}"`)
      setUsers((u) => u.filter((x) => x.id !== pendingDelete.id))
      // History entries from that user will still show their old username text,
      // so we don't filter the local list — a re-fetch would clean it but that's
      // intentional: history is an audit log.
      setPendingDelete(null)
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const stats = useMemo(() => ({
    users: users.length,
    actions: history.length,
    words: new Set(history.map((h) => h.word)).size,
  }), [users, history])

  const visibleHistory = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return history
    return history.filter(
      (h) =>
        h.username.toLowerCase().includes(s) ||
        h.word.toLowerCase().includes(s) ||
        h.action.toLowerCase().includes(s)
    )
  }, [history, search])

  const visibleUsers = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return users
    return users.filter((u) => u.username.toLowerCase().includes(s))
  }, [users, search])

  const tabBtnClass = (val) =>
    `btn-pop !py-2 !px-4 !text-xs ${tab === val ? 'btn-primary' : 'btn-ghost'}`

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black mb-1 flex items-center gap-2">
            Admin Dashboard
            <ShieldCheck className="w-8 h-8 text-[color:var(--color-primary)]" strokeWidth={3} />
          </h1>
          <p className="text-[color:var(--color-ink-soft)] font-bold">
            Monitor user activity and manage accounts.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <StatCard icon={Users} label="Total Users" value={stats.users} color="blue" />
          <StatCard icon={Activity} label="Total Actions" value={stats.actions} color="mint" />
          <StatCard icon={FileText} label="Unique Words" value={stats.words} color="purple" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-2">
            <button className={tabBtnClass('users')} onClick={() => setTab('users')}>
              <Users className="w-4 h-4" strokeWidth={3} />
              Users
            </button>
            <button className={tabBtnClass('history')} onClick={() => setTab('history')}>
              <Activity className="w-4 h-4" strokeWidth={3} />
              History
            </button>
          </div>
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--color-ink-soft)]"
              strokeWidth={3}
            />
            <input
              className="input-pop !pl-10"
              placeholder={tab === 'users' ? 'Filter by username...' : 'Filter by user, word, or action...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'users' ? (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="card-pop bg-white overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[color:var(--color-duo-cream)]">
                    <tr>
                      <Th>ID</Th>
                      <Th>Username</Th>
                      <Th>Role</Th>
                      <Th>Words</Th>
                      <Th>Check-ins</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows cols={6} />
                    ) : visibleUsers.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-[color:var(--color-ink-soft)] font-bold">No users to show.</td></tr>
                    ) : (
                      visibleUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t-2 border-[color:var(--color-line)] hover:bg-[color:var(--color-duo-cream)]/50 transition"
                        >
                          <td className="p-4 font-bold text-[color:var(--color-ink-soft)]">#{u.id}</td>
                          <td className="p-4 font-extrabold">{u.username}</td>
                          <td className="p-4">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs uppercase font-black ${
                              u.is_admin
                                ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary-dark)]'
                                : 'bg-[color:var(--color-sky-light)] text-[color:var(--color-sky-dark)]'
                            }`}>
                              {u.is_admin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-[color:var(--color-ink-soft)]">{u.word_count}</td>
                          <td className="p-4 font-bold text-[color:var(--color-ink-soft)]">{u.checkin_count}</td>
                          <td className="p-4">
                            {u.is_admin ? (
                              <span className="text-xs italic text-[color:var(--color-ink-soft)] font-bold">
                                Protected
                              </span>
                            ) : (
                              <button
                                onClick={() => setPendingDelete(u)}
                                className="btn-pop btn-coral !py-1.5 !px-3 !text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={3} />
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="card-pop bg-white overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[color:var(--color-duo-cream)]">
                    <tr>
                      <Th>User</Th>
                      <Th>Word</Th>
                      <Th>Action</Th>
                      <Th>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows cols={4} />
                    ) : visibleHistory.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-[color:var(--color-ink-soft)] font-bold">No activity to show.</td></tr>
                    ) : (
                      visibleHistory.map((item, i) => (
                        <tr
                          key={i}
                          className="border-t-2 border-[color:var(--color-line)] hover:bg-[color:var(--color-duo-cream)]/50 transition"
                        >
                          <td className="p-4 font-extrabold">{item.username}</td>
                          <td className="p-4 font-bold text-[color:var(--color-sky-dark)]">
                            {item.word}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs uppercase font-black ${
                              actionColors[item.action] || 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-bold text-[color:var(--color-ink-soft)]">
                            {item.timestamp}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User?"
        message={
          pendingDelete
            ? `This will permanently delete "${pendingDelete.username}" along with their ${pendingDelete.word_count} word(s), check-ins, and history. This cannot be undone.`
            : ''
        }
        confirmLabel="Yes, delete"
        confirmStyle="coral"
        submitting={deleting}
      />
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="text-left p-4 text-xs uppercase font-black text-[color:var(--color-ink-soft)]">
      {children}
    </th>
  )
}

function SkeletonRows({ cols }) {
  return [...Array(5)].map((_, i) => (
    <tr key={i} className="border-t-2 border-[color:var(--color-line)]">
      <td colSpan={cols} className="p-4">
        <div className="h-5 bg-[color:var(--color-line)] rounded animate-pulse" />
      </td>
    </tr>
  ))
}
