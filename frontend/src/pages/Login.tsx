import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/dashboard'
  if (user) return <Navigate to={next} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(username, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand brand-center">
          <img src="/favicon.svg" alt="" width={36} height={36} />
          <span>Crewboard</span>
        </div>
        <p className="login-lead">Sign in to see your projects and tasks.</p>
        <label className="field">
          <span>Username</span>
          <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="login-hint">Fieldline Studio internal tool</p>
      </form>
    </div>
  )
}
