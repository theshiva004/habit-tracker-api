import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Check, CheckCircle2, Circle, Clock3, Flame, LogOut, MoreHorizontal,
  Pencil, Plus, Sparkles, Trash2, UserRound, X,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}, token) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof URLSearchParams) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Something went wrong. Please try again.')
  }
  return response.status === 204 ? null : response.json()
}

const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('habit-token'))
  const [user, setUser] = useState(null)
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [historyHabit, setHistoryHabit] = useState(null)
  const [history, setHistory] = useState([])
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsHistory, setStatsHistory] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)

  const completed = useMemo(() => habits.filter((habit) => habit.completed_today).length, [habits])
  const progress = habits.length ? Math.round((completed / habits.length) * 100) : 0

  useEffect(() => {
    if (!token) return
    Promise.all([request('/users/me', {}, token), request('/habits/today', {}, token)])
      .then(([currentUser, todayHabits]) => {
        setUser(currentUser)
        setHabits(todayHabits)
      })
      .catch((reason) => {
        setError(reason.message)
        if (reason.message.includes('credentials') || reason.message.includes('authenticate')) logout()
      })
      .finally(() => setLoading(false))
  }, [token])

  function logout() {
    localStorage.removeItem('habit-token')
    setToken(null)
    setUser(null)
    setHabits([])
    setLoading(false)
  }

  async function toggleHabit(habit) {
    setError('')
    try {
      if (habit.completed_today) await request(`/habits/${habit.id}/complete`, { method: 'DELETE' }, token)
      else await request(`/habits/${habit.id}/complete`, { method: 'POST' }, token)
      setHabits(await request('/habits/today', {}, token))
    } catch (reason) { setError(reason.message) }
  }

  async function saveHabit(values, editingHabit) {
    setError('')
    try {
      const saved = await request(
        editingHabit ? `/habits/${editingHabit.id}` : '/habits',
        { method: editingHabit ? 'PUT' : 'POST', body: JSON.stringify(values) },
        token,
      )
      setHabits((current) => editingHabit
        ? current.map((habit) => habit.id === saved.id ? { ...habit, ...saved } : habit)
        : [...current, { ...saved, completed_today: false }])
      setModal(null)
    } catch (reason) { setError(reason.message) }
  }

  async function removeHabit(habit) {
    if (!window.confirm(`Delete “${habit.name}”? This cannot be undone.`)) return
    try {
      await request(`/habits/${habit.id}`, { method: 'DELETE' }, token)
      setHabits((current) => current.filter((item) => item.id !== habit.id))
    } catch (reason) { setError(reason.message) }
  }

  async function showHistory(habit) {
    try {
      setHistoryHabit(habit)
      setHistory(await request(`/habits/${habit.id}/completions`, {}, token))
    } catch (reason) { setError(reason.message) }
  }

  async function showStats() {
    setError('')
    setStatsOpen(true)
    setStatsLoading(true)
    try {
      const stats = await request('/users/me/stats', {}, token)
      setStatsHistory(stats.history)
    } catch (reason) {
      setError(reason.message)
      setStatsOpen(false)
    } finally { setStatsLoading(false) }
  }

  if (!token) return <AuthScreen onAuthenticated={setToken} />
  if (loading) return <div className="page-loader"><span className="loader" />Loading your rituals</div>

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span> RITUAL</div>
        <div className="user-actions"><button className="avatar" title="View your statistics" aria-label="View your statistics" onClick={showStats}>{user?.email?.[0]?.toUpperCase()}</button><button className="icon-button" title="Sign out" onClick={logout}><LogOut size={18} /></button></div>
      </header>
      <section className="welcome">
        <div><p className="eyebrow">{dateLabel.format(new Date())}</p><h1>Make today count.</h1><p className="subtle">Small, deliberate actions become your momentum.</p></div>
        <button className="primary-button" onClick={() => setModal({})}><Plus size={18} />New habit</button>
      </section>
      {error && <div className="notice" role="alert"><span>{error}</span><button onClick={() => setError('')} title="Dismiss"><X size={16} /></button></div>}
      <section className="progress-panel" aria-label="Today’s progress">
        <div><p className="eyebrow">Today’s progress</p><strong>{completed} <span>of {habits.length} complete</span></strong></div>
        <div className="progress-meter"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
      </section>
      <section className="habit-section">
        <div className="section-heading"><h2>Today</h2><span>{habits.length} {habits.length === 1 ? 'habit' : 'habits'}</span></div>
        {habits.length ? <div className="habit-list">{habits.map((habit) => <HabitRow key={habit.id} habit={habit} onToggle={toggleHabit} onEdit={() => setModal(habit)} onDelete={() => removeHabit(habit)} onHistory={() => showHistory(habit)} />)}</div>
          : <EmptyState onCreate={() => setModal({})} />}
      </section>
      {modal && <HabitModal habit={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveHabit} />}
      {historyHabit && <HistoryModal habit={historyHabit} history={history} onClose={() => setHistoryHabit(null)} />}
      {statsOpen && <StatsModal history={statsHistory} loading={statsLoading} onClose={() => setStatsOpen(false)} />}
    </main>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError(''); setSubmitting(true)
    try {
      if (mode === 'register') await request('/register', { method: 'POST', body: JSON.stringify({ email, password }) })
      const body = new URLSearchParams({ username: email, password })
      const token = await request('/login', { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      localStorage.setItem('habit-token', token.access_token); onAuthenticated(token.access_token)
    } catch (reason) { setError(reason.message) } finally { setSubmitting(false) }
  }
  return <main className="auth-page"><section className="auth-copy"><div className="brand"><span className="brand-mark"><Sparkles size={17} /></span> RITUAL</div><div><p className="eyebrow">Your everyday practice</p><h1>A better day,<br />built daily.</h1><p>Build a quiet system for the habits that matter to you.</p></div><div className="quote">“We are what we repeatedly do.”<span>Aristotle</span></div></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div><p className="eyebrow">Welcome</p><h2>{mode === 'login' ? 'Good to see you.' : 'Start your practice.'}</h2></div>{error && <div className="notice" role="alert">{error}</div>}<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength="8" required /></label><button className="primary-button auth-submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? <>Sign in <ArrowRight size={17} /></> : <>Create account <ArrowRight size={17} /></>}</button><p className="switch-copy">{mode === 'login' ? 'New here?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></form></section></main>
}

function HabitRow({ habit, onToggle, onEdit, onDelete, onHistory }) {
  const [open, setOpen] = useState(false)
  return <article className={`habit-row ${habit.completed_today ? 'is-complete' : ''}`}><button className="check-button" onClick={() => onToggle(habit)} aria-label={`Mark ${habit.name} as ${habit.completed_today ? 'incomplete' : 'complete'}`}>{habit.completed_today ? <CheckCircle2 /> : <Circle />}</button><button className="habit-main" onClick={onHistory}><span>{habit.name}</span>{habit.description && <small>{habit.description}</small>}<div className="habit-metrics"><span title="Consecutive completed days ending today"><Flame size={14} />{habit.current_streak} day streak</span><span>{habit.completed_days_last_30}/{habit.tracked_days_last_30} days · {habit.completion_rate_last_30}% in 30 days</span></div></button><div className="row-actions"><button className="icon-button" title="Habit options" onClick={() => setOpen(!open)}><MoreHorizontal size={20} /></button>{open && <div className="action-menu"><button onClick={onHistory}><Clock3 size={15} />History</button><button onClick={onEdit}><Pencil size={15} />Edit</button><button className="danger" onClick={onDelete}><Trash2 size={15} />Delete</button></div>}</div></article>
}

function EmptyState({ onCreate }) { return <div className="empty-state"><div className="empty-icon"><Check size={28} /></div><h3>Your day is open.</h3><p>Add the first habit you want to practice today.</p><button className="text-button" onClick={onCreate}>Add a habit <ArrowRight size={16} /></button></div> }

function HabitModal({ habit, onClose, onSave }) {
  const [name, setName] = useState(habit?.name || '')
  const [description, setDescription] = useState(habit?.description || '')
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="modal" onSubmit={(event) => { event.preventDefault(); onSave({ name, description: description || null }, habit) }} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">{habit ? 'Refine your practice' : 'A small beginning'}</p><h2>{habit ? 'Edit habit' : 'New habit'}</h2></div><button type="button" className="icon-button" onClick={onClose} title="Close"><X size={19} /></button></div><label>Habit name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Read for 20 minutes" maxLength="100" required /></label><label>Note <span className="optional">optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Why does this matter to you?" maxLength="300" rows="3" /></label><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">{habit ? 'Save changes' : 'Create habit'}</button></div></form></div>
}

function HistoryModal({ habit, history, onClose }) { return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal history-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">Completion history</p><h2>{habit.name}</h2></div><button className="icon-button" onClick={onClose} title="Close"><X size={19} /></button></div>{history.length ? <div className="history-list">{history.slice(0, 12).map((item) => <div key={item.id}><CheckCircle2 size={18} /><span>{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.completed_at))}</span></div>)}</div> : <p className="empty-history">No completions yet. Today is a good day to begin.</p>}</section></div> }

function StatsModal({ history, loading, onClose }) {
  const total = history.reduce((sum, day) => sum + day.completed_habits, 0)
  const dateFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal stats-modal" aria-label="Your 30-day statistics" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">Your progress</p><h2><UserRound size={23} />Last 30 days</h2></div><button className="icon-button" onClick={onClose} title="Close"><X size={19} /></button></div>{loading ? <div className="stats-loading"><span className="loader" />Loading your history</div> : <><p className="stats-summary"><strong>{total}</strong> habit completions across the last 30 days.</p><div className="stats-history">{history.map((day) => <div className="stats-day" key={day.date}><span>{dateFormat.format(new Date(`${day.date}T00:00:00`))}</span><b>{day.completed_habits} {day.completed_habits === 1 ? 'habit' : 'habits'}</b></div>)}</div></>}</section></div>
}

export default App
