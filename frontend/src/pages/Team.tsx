import type { Member } from '../api'
import { Avatar, ErrorState, Loading, PageHeader, RoleBadge } from '../components/ui'
import { formatDate } from '../format'
import { useApi } from '../useApi'

export default function Team() {
  const { data, error } = useApi<Member[]>('/team')
  if (error) return <ErrorState message={error} />
  if (!data) return <Loading />

  return (
    <>
      <PageHeader title="Team" subtitle={`${data.length} people on the Fieldline Studio team`} />
      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Open tasks</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="member">
                    <Avatar name={m.name} size={36} />
                    <div>
                      <div className="list-primary">{m.name}</div>
                      <div className="list-secondary">
                        {m.title} · <a href={`mailto:${m.email}`}>{m.email}</a>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <RoleBadge role={m.role} />
                </td>
                <td>{m.open_tasks}</td>
                <td className="nowrap">{formatDate(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
