import { PageHeader } from '../components/ui'

const QUESTIONS = [
  { q: 'Where do I see what is due this week?', a: 'The dashboard lists open tasks and projects at risk, newest first.' },
  { q: 'How do I find a project?', a: 'Projects has every project with its client and due date; filter by status at the top.' },
  { q: 'Who can invite people?', a: 'Admins invite teammates from the Admin page. Members can see projects, tasks and the team.' },
]

export default function Help() {
  return (
    <>
      <PageHeader title="Help" subtitle="Answers to the questions people ask most." />
      <section className="card">
        <h2 className="card-title">Common questions</h2>
        <ul className="list">
          {QUESTIONS.map((item) => (
            <li key={item.q}>
              <div className="list-primary">{item.q}</div>
              <div className="list-secondary">{item.a}</div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
