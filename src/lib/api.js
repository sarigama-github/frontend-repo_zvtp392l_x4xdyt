const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('token') || ''
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(getToken())}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = `Error ${res.status}`
    try {
      const data = await res.json()
      msg = data.detail || msg
    } catch {}
    throw new Error(msg)
  }
  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

export const AuthAPI = {
  async login(email, password) {
    const data = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json())
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    return data
  },
  async register(name, email, password) {
    const data = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(r => r.json())
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    return data
  },
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  me() {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  }
}

export const DashboardAPI = {
  summary() { return api('/dashboard/summary') }
}

export const CRMAPI = {
  listContacts({ status, q } = {}) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    return api(`/crm/contacts?${params.toString()}`)
  },
  createContact(contact) { return api('/crm/contacts', { method: 'POST', body: contact }) },
  updateContact(id, contact) { return api(`/crm/contacts/${id}`, { method: 'PUT', body: contact }) },
  deleteContact(id) { return api(`/crm/contacts/${id}`, { method: 'DELETE' }) },
  exportContacts() { return `${BASE_URL}/crm/contacts/export?token=${encodeURIComponent(getToken())}` },
}

export const QuoteAPI = {
  list({ status } = {}) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    return api(`/quotes?${params.toString()}`)
  },
  create(quote) { return api('/quotes', { method: 'POST', body: quote }) },
  update(id, quote) { return api(`/quotes/${id}`, { method: 'PUT', body: quote }) },
  remove(id) { return api(`/quotes/${id}`, { method: 'DELETE' }) },
}

export const ProjectAPI = {
  listProjects() { return api('/projects') },
  createProject(p) { return api('/projects', { method: 'POST', body: p }) },
  listTasks(params = {}) {
    const usp = new URLSearchParams(params)
    return api(`/tasks?${usp.toString()}`)
  },
  createTask(t) { return api('/tasks', { method: 'POST', body: t }) },
  updateTask(id, t) { return api(`/tasks/${id}`, { method: 'PUT', body: t }) },
  deleteTask(id) { return api(`/tasks/${id}`, { method: 'DELETE' }) },
}

export const SettingsAPI = {
  get() { return api('/settings') },
  update(s) { return api('/settings', { method: 'PUT', body: s }) },
  listUsers() { return api('/users') },
}
