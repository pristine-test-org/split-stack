import { Link, useParams } from 'react-router-dom'
import type { ProjectDetail as ProjectDetailData } from '../api'
import { Avatar, ErrorState, Loading, PageHeader, PriorityTag, Progress, StatusBadge } from '../components/ui'
import { dueLabel, formatDate } from '../format'
import { useApi } from '../useApi'

export default function ProjectDetail() {
  const { id } = useParams()
  const { data, error } = useApi<ProjectDetailData>(`/projects/${id}`)
  if (error) return <ErrorState message={error} />
  if (!data) return <Loading />

  const open = data.tasks.filter((t) => t.status !== 'done').length

  return (
    <>
      <Link className="back-link" to="/projects">
        ← All projects
      </Link>
      <PageHeader title={data.name} subtitle={data.client}>
        <StatusBadge status={data.status} />
      </PageHeader>

      <section className="card detail-summary">
        <p className="detail-description">{data.description}</p>
        <dl className="facts">
          <div>
            <dt>Owner</dt>
            <dd className="person">
              <Avatar name={data.owner_name} size={24} />
              {data.owner_name}
            </dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatDate(data.due_date)}</dd>
          </div>
          <div>
            <dt>Open tasks</dt>
            <dd>
              {open} of {data.task_count}
            </dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd>
              <Progress done={data.done_count} total={data.task_count} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="card card-flush">
        <h2 className="card-title card-title-padded">Tasks</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.map((t) => {
              const due = dueLabel(t.due_date)
              return (
                <tr key={t.id} className={t.status === 'done' ? 'row-done' : undefined}>
                  <td className="task-title">{t.title}</td>
                  <td>
                    <span className="person">
                      <Avatar name={t.assignee_name} size={24} />
                      {t.assignee_name}
                    </span>
                  </td>
                  <td>
                    <PriorityTag priority={t.priority} />
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="nowrap">
                    {t.status === 'done' ? (
                      formatDate(t.due_date)
                    ) : (
                      <span className={due.overdue ? 'text-danger' : undefined}>{due.text}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </>
  )
}
