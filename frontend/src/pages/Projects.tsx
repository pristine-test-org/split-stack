import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project, ProjectStatus } from '../api'
import { Avatar, ErrorState, Loading, PageHeader, Progress, StatusBadge } from '../components/ui'
import { formatDate } from '../format'
import { useApi } from '../useApi'

const FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'planning', label: 'Planning' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
]

export default function Projects() {
  const { data, error } = useApi<Project[]>('/projects')
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  if (error) return <ErrorState message={error} />
  if (!data) return <Loading />

  const rows = filter === 'all' ? data : data.filter((p) => p.status === filter)

  return (
    <>
      <PageHeader title="Projects" subtitle={`${data.length} projects for clients and the studio itself`} />

      <div className="filters" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            className={`chip${filter === f.value ? ' chip-active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="table-link" to={`/projects/${p.id}`}>
                    {p.name}
                  </Link>
                  <div className="list-secondary">{p.client}</div>
                </td>
                <td>
                  <span className="person">
                    <Avatar name={p.owner_name} size={24} />
                    {p.owner_name}
                  </span>
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>
                  <Progress done={p.done_count} total={p.task_count} />
                </td>
                <td className="nowrap">{formatDate(p.due_date)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted table-empty">
                  No projects with this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
