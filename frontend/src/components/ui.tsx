import type { ReactNode } from 'react'
import type { Priority, ProjectStatus, Role, TaskStatus } from '../api'
import { initials } from '../format'

const STATUS_LABELS: Record<ProjectStatus | TaskStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  at_risk: 'At risk',
  on_hold: 'On hold',
  completed: 'Completed',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export function StatusBadge({ status }: { status: ProjectStatus | TaskStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
}

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span className={`priority priority-${priority}`}>
      <span className="priority-dot" aria-hidden />
      {priority[0].toUpperCase() + priority.slice(1)}
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`badge badge-role-${role}`}>{role === 'admin' ? 'Admin' : 'Member'}</span>
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const hue = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 35% 88%)`, color: `hsl(${hue} 40% 28%)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="progress" title={`${done} of ${total} tasks done`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{pct}%</span>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children}
    </header>
  )
}

export function Loading() {
  return <div className="state">Loading…</div>
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state state-error">Something went wrong: {message}</div>
}
