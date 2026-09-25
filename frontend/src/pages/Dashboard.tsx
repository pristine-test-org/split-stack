import { Link } from 'react-router-dom'
import type { Dashboard as DashboardData } from '../api'
import { useAuth } from '../auth'
import { ErrorState, Loading, PageHeader, PriorityTag, StatusBadge } from '../components/ui'
import { dueLabel, timeAgo } from '../format'
import { useApi } from '../useApi'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error } = useApi<DashboardData>('/dashboard')
  if (error) return <ErrorState message={error} />
  if (!data) return <Loading />

  const { counts } = data
  const firstName = user?.name.split(' ')[0]

  return (
    <>
      <PageHeader title={`Good to see you, ${firstName}`} subtitle="Here's where the studio's work stands today." />

      <section className="stats">
        <div className="stat">
          <div className="stat-label">Projects in progress</div>
          <div className="stat-value">{counts.active_projects}</div>
          <div className="stat-note">{counts.at_risk_projects} at risk</div>
        </div>
        <div className="stat">
          <div className="stat-label">Open tasks</div>
          <div className="stat-value">{counts.open_tasks}</div>
          <div className="stat-note">across all projects</div>
        </div>
        <div className="stat">
          <div className="stat-label">Tasks done</div>
          <div className="stat-value">{counts.done_tasks}</div>
          <div className="stat-note">since kickoff</div>
        </div>
        <div className="stat">
          <div className="stat-label">Team members</div>
          <div className="stat-value">{counts.members}</div>
          <div className="stat-note">
            <Link to="/team">View team</Link>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2 className="card-title">Assigned to you</h2>
          {data.my_tasks.length === 0 ? (
            <p className="muted">Nothing open. Nice.</p>
          ) : (
            <ul className="list">
              {data.my_tasks.map((t) => {
                const due = dueLabel(t.due_date)
                return (
                  <li key={t.id} className="list-row">
                    <div>
                      <div className="list-primary">{t.title}</div>
                      <div className="list-secondary">
                        <Link to={`/projects/${t.project_id}`}>{t.project_name}</Link>
                        {' · '}
                        <span className={due.overdue ? 'text-danger' : undefined}>{due.text}</span>
                      </div>
                    </div>
                    <div className="list-meta">
                      <PriorityTag priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="card-title">Recent activity</h2>
          <ul className="list activity">
            {data.recent_activity.map((a) => (
              <li key={a.id} className="list-row">
                <div>
                  <div className="list-primary">
                    <strong>{a.actor_name}</strong> {a.verb} <em>{a.subject}</em>
                  </div>
                  <div className="list-secondary">
                    <Link to={`/projects/${a.project_id}`}>{a.project_name}</Link>
                  </div>
                </div>
                <time className="list-time" dateTime={a.created_at}>
                  {timeAgo(a.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
