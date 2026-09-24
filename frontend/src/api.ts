export type Role = 'admin' | 'member'

export interface User {
  id: number
  username: string
  name: string
  email: string
  title: string
  role: Role
}

export type ProjectStatus = 'planning' | 'active' | 'at_risk' | 'on_hold' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Project {
  id: number
  name: string
  client: string
  description: string
  status: ProjectStatus
  due_date: string
  owner_id: number
  owner_name: string
  task_count: number
  done_count: number
}

export interface Task {
  id: number
  title: string
  status: TaskStatus
  priority: Priority
  due_date: string
  updated_at: string
  assignee_name: string
}

export interface ProjectDetail extends Project {
  tasks: Task[]
}

export interface Dashboard {
  counts: {
    active_projects: number
    at_risk_projects: number
    open_tasks: number
    done_tasks: number
    members: number
  }
  recent_activity: {
    id: number
    verb: string
    subject: string
    created_at: string
    actor_name: string
    project_id: number
    project_name: string
  }[]
  my_tasks: {
    id: number
    title: string
    status: TaskStatus
    priority: Priority
    due_date: string
    project_id: number
    project_name: string
  }[]
}

export interface Member {
  id: number
  name: string
  email: string
  title: string
  role: Role
  created_at: string
  open_tasks: number
}

export interface AuditEntry {
  id: number
  action: string
  target: string
  ip: string
  created_at: string
  actor_name: string
}

export interface Invite {
  id: number
  email: string
  role: Role
  created_at: string
  invited_by_name: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      // not JSON
    }
    throw new ApiError(res.status, message)
  }
  return res.json() as Promise<T>
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
}
