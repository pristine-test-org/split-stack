import { useState, type FormEvent } from 'react'
import { post, type AuditEntry, type Invite, type Role } from '../api'
import { ErrorState, Loading, PageHeader, RoleBadge } from '../components/ui'
import { timeAgo } from '../format'
import { useApi } from '../useApi'

export default function Admin() {
  const audit = useApi<AuditEntry[]>('/admin/audit')
  const invites = useApi<Invite[]>('/admin/invites')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const invite = await post<Invite>('/admin/invite', { email, role })
      invites.setData((list) => [invite, ...(list ?? [])])
      setMessage({ kind: 'ok', text: `Invite sent to ${invite.email}` })
      setEmail('')
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Admin" subtitle="Invite people and review what's changed." />

      <div className="grid-2">
        <section className="card">
          <h2 className="card-title">Invite a teammate</h2>
          <form className="invite-form" onSubmit={onInvite}>
            <label className="field">
              <span>Work email</span>
              <input
                type="email"
                placeholder="name@fieldline.example"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <small className="field-help">
                {role === 'admin' ? 'Can also invite people and see the audit log.' : 'Can see projects, tasks and the team.'}
              </small>
            </label>
            {message && <div className={message.kind === 'ok' ? 'form-success' : 'form-error'}>{message.text}</div>}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title">Pending invites</h2>
          {invites.error && <ErrorState message={invites.error} />}
          {invites.data && (
            <ul className="list">
              {invites.data.map((i) => (
                <li key={i.id} className="list-row">
                  <div>
                    <div className="list-primary">{i.email}</div>
                    <div className="list-secondary">
                      Invited by {i.invited_by_name} · {timeAgo(i.created_at)}
                    </div>
                  </div>
                  <RoleBadge role={i.role} />
                </li>
              ))}
              {invites.data.length === 0 && <li className="muted">No pending invites.</li>}
            </ul>
          )}
        </section>
      </div>

      <section className="card card-flush">
      <h2 className="card-title card-title-padded">Audit log</h2>
        {audit.error && <ErrorState message={audit.error} />}
        {!audit.data && !audit.error && <Loading />}
        {audit.data && (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {audit.data.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap muted">{timeAgo(a.created_at)}</td>
                  <td className="nowrap">{a.actor_name}</td>
                  <td>
                    <code className="action">{a.action}</code>
                  </td>
                  <td>{a.target}</td>
                  <td className="muted mono">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
