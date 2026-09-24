import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Avatar, RoleBadge } from './ui'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  async function signOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>Crewboard</span>
        </div>
        <nav className="nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/team">Team</NavLink>
          <NavLink to="/help">Help</NavLink>
          {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="sidebar-footer">Fieldline Studio</div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="topbar-user">
            <Avatar name={user.name} />
            <div>
              <div className="topbar-name">{user.name}</div>
              <div className="topbar-title">{user.title}</div>
            </div>
            <RoleBadge role={user.role} />
          </div>
          <button className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
