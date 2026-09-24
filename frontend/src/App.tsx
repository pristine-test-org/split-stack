import type { ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import { Loading } from './components/ui'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ProjectDetail from './pages/ProjectDetail'
import Projects from './pages/Projects'
import Team from './pages/Team'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user === undefined) return <Loading />
  if (user === null) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'admin') {
    return (
      <div className="card empty-card">
        <h1>Admins only</h1>
        <p>You're signed in as a member. Ask an admin if you need to invite people or see the audit log.</p>
        <Link className="btn" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    )
  }
  return children
}

function NotFound() {
  return (
    <div className="card empty-card">
      <h1>Page not found</h1>
      <p>That page doesn't exist or was moved.</p>
      <Link className="btn" to="/dashboard">
        Back to dashboard
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="team" element={<Team />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
