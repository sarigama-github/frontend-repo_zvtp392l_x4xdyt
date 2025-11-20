import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Home, Users, FileText, Kanban, Settings, LogOut, Plus, Filter, Download } from 'lucide-react'
import { AuthAPI, DashboardAPI, CRMAPI, QuoteAPI, ProjectAPI, SettingsAPI } from './lib/api'
import './index.css'

function Layout({ children }) {
  const user = AuthAPI.me()
  const navigate = useNavigate()
  function logout() { AuthAPI.logout(); navigate('/login') }
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold text-slate-800 flex items-center gap-2"><Home size={18}/> SMB Suite</Link>
          <div className="flex-1"/>
          {user && <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user.name} · {user.role}</span>
            <button onClick={logout} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"><LogOut size={16}/> Logout</button>
          </div>}
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <aside className="lg:col-span-1 space-y-2">
          <NavLink to="/" icon={<Home size={16}/>} label="Dashboard"/>
          <NavLink to="/crm" icon={<Users size={16}/>} label="CRM"/>
          <NavLink to="/quotes" icon={<FileText size={16}/>} label="Quotes"/>
          <NavLink to="/projects" icon={<Kanban size={16}/>} label="Projects"/>
          <NavLink to="/settings" icon={<Settings size={16}/>} label="Settings"/>
        </aside>
        <main className="lg:col-span-4">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ to, icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 text-slate-700">{icon}{label}</Link>
  )
}

function Dashboard() {
  const [data, setData] = useState(null)
  useEffect(() => { DashboardAPI.summary().then(setData).catch(()=>{}) }, [])
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Clients" value={data?.counts?.clients || 0} />
        <Stat title="Quotes" value={data?.counts?.quotes || 0} />
        <Stat title="Tasks Pending" value={data?.counts?.tasks_pending || 0} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Recent Contacts">
          <ul className="divide-y">
            {(data?.recent_contacts||[]).map(c => <li key={c._id} className="py-2 text-sm">{c.name} <span className="text-xs text-slate-500">· {c.status}</span></li>)}
          </ul>
        </Card>
        <Card title="Recent Quotes">
          <ul className="divide-y">
            {(data?.recent_quotes||[]).map(q => <li key={q._id} className="py-2 text-sm">{q.company_name||'Quote'} <span className="text-xs text-slate-500">· {q.status}</span></li>)}
          </ul>
        </Card>
        <Card title="Recent Tasks">
          <ul className="divide-y">
            {(data?.recent_tasks||[]).map(t => <li key={t._id} className="py-2 text-sm">{t.title} <span className="text-xs text-slate-500">· {t.status}</span></li>)}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function Stat({ title, value }) { return (
  <div className="bg-white rounded border p-4">
    <div className="text-slate-500 text-sm">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
)}

function Card({ title, children, actions }) { return (
  <div className="bg-white rounded border p-4">
    <div className="flex items-center justify-between mb-3"><div className="font-medium">{title}</div>{actions}</div>
    {children}
  </div>
)}

function CRM() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', company_name: '', status: 'Prospect' })
  function load(){ CRMAPI.listContacts({ status: filter || undefined }).then(setItems) }
  useEffect(() => { load() }, [filter])
  function submit(e){ e.preventDefault(); CRMAPI.createContact(form).then(()=>{ setForm({ name:'', email:'', phone:'', company_name:'', status:'Prospect' }); load() }) }
  function remove(id){ if (confirm('Delete contact?')) CRMAPI.deleteContact(id).then(load) }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CRM</h1>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option>Prospect</option>
            <option>Client</option>
            <option>Negotiation</option>
          </select>
          <a href={CRMAPI.exportContacts()} className="inline-flex items-center gap-1 text-sm px-2 py-1 border rounded"><Download size={14}/> Export CSV</a>
        </div>
      </div>
      <Card title="Add Contact">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input required placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="border rounded px-2 py-1 md:col-span-2"/>
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="border rounded px-2 py-1"/>
          <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="border rounded px-2 py-1"/>
          <input placeholder="Company" value={form.company_name} onChange={e=>setForm({...form, company_name:e.target.value})} className="border rounded px-2 py-1"/>
          <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="border rounded px-2 py-1">
            <option>Prospect</option><option>Negotiation</option><option>Client</option>
          </select>
          <button className="bg-slate-900 text-white px-3 py-1 rounded md:col-span-1"><Plus size={14}/> Add</button>
        </form>
      </Card>
      <Card title="Contacts">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th/></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c._id} className="border-t">
                <td className="py-2">{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.company_name}</td>
                <td>{c.status}</td>
                <td className="text-right"><button onClick={()=>remove(c._id)} className="text-red-600">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Quotes() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ company_name: '', items: [{ name:'Service', unit_price: 100, quantity: 1, tax_rate: 0 }] })
  function load(){ QuoteAPI.list().then(setItems) }
  useEffect(()=>{ load() }, [])
  function addItem(){ setForm({ ...form, items:[...form.items, { name:'', unit_price:0, quantity:1, tax_rate:0 }] }) }
  function submit(e){ e.preventDefault(); QuoteAPI.create(form).then(()=>{ setForm({ company_name:'', items:[{ name:'Service', unit_price: 100, quantity:1, tax_rate:0 }] }); load() }).catch(e=>alert(e.message)) }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Quotes</h1></div>
      <Card title="New Quote">
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Company" value={form.company_name} onChange={e=>setForm({ ...form, company_name:e.target.value })} className="border rounded px-2 py-1"/>
          <div className="space-y-2">
            {form.items.map((it, idx)=> (
              <div key={idx} className="grid grid-cols-5 gap-2">
                <input placeholder="Item" value={it.name} onChange={e=>updateItem(idx,{ name:e.target.value })} className="border rounded px-2 py-1"/>
                <input type="number" step="0.01" placeholder="Unit Price" value={it.unit_price} onChange={e=>updateItem(idx,{ unit_price:parseFloat(e.target.value) })} className="border rounded px-2 py-1"/>
                <input type="number" step="0.01" placeholder="Qty" value={it.quantity} onChange={e=>updateItem(idx,{ quantity:parseFloat(e.target.value) })} className="border rounded px-2 py-1"/>
                <input type="number" step="0.01" placeholder="Tax %" value={it.tax_rate} onChange={e=>updateItem(idx,{ tax_rate:parseFloat(e.target.value) })} className="border rounded px-2 py-1"/>
                <div className="flex items-center"><button type="button" onClick={()=>removeItem(idx)} className="text-red-600 text-sm">Remove</button></div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm inline-flex items-center gap-1 text-slate-700"><Plus size={14}/> Add item</button>
          </div>
          <button className="bg-slate-900 text-white px-3 py-1 rounded">Create Quote</button>
        </form>
      </Card>
      <Card title="Quotes">
        <ul className="divide-y">
          {items.map(q => (
            <li key={q._id} className="py-2 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{q.company_name || 'Quote'}</div>
                <div className="text-xs text-slate-500">{q.status} · Total {q.total}</div>
              </div>
              {q.public_token && <a href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/public/quote/${q.public_token}`} className="text-slate-700 underline">Share</a>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )

  function updateItem(idx, patch){
    const items = form.items.map((it,i)=> i===idx ? { ...it, ...patch } : it)
    setForm({ ...form, items })
  }
  function removeItem(idx){ setForm({ ...form, items: form.items.filter((_,i)=>i!==idx) }) }
}

function Projects() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [pname, setPname] = useState('')
  const [task, setTask] = useState({ project_id: '', title: '', priority: 'Medium', status: 'To Do' })
  function load(){ ProjectAPI.listProjects().then(setProjects); ProjectAPI.listTasks().then(setTasks) }
  useEffect(()=>{ load() }, [])
  function addProject(e){ e.preventDefault(); if(!pname) return; ProjectAPI.createProject({ name: pname }).then(()=>{ setPname(''); load() }) }
  function addTask(e){ e.preventDefault(); if(!task.title) return; ProjectAPI.createTask(task).then(()=>{ setTask({ project_id:'', title:'', priority:'Medium', status:'To Do' }); load() }) }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects & Planning</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Create Project">
          <form onSubmit={addProject} className="flex gap-2">
            <input placeholder="Project name" value={pname} onChange={e=>setPname(e.target.value)} className="border rounded px-2 py-1 flex-1"/>
            <button className="bg-slate-900 text-white px-3 py-1 rounded">Add</button>
          </form>
          <ul className="mt-3 text-sm divide-y">
            {projects.map(p => <li key={p._id} className="py-2">{p.name}</li>)}
          </ul>
        </Card>
        <Card title="Create Task">
          <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select value={task.project_id} onChange={e=>setTask({ ...task, project_id:e.target.value })} className="border rounded px-2 py-1">
              <option value="">Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <input placeholder="Task title" value={task.title} onChange={e=>setTask({ ...task, title:e.target.value })} className="border rounded px-2 py-1 md:col-span-2"/>
            <select value={task.priority} onChange={e=>setTask({ ...task, priority:e.target.value })} className="border rounded px-2 py-1">
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <select value={task.status} onChange={e=>setTask({ ...task, status:e.target.value })} className="border rounded px-2 py-1">
              <option>To Do</option><option>In Progress</option><option>Completed</option>
            </select>
            <button className="bg-slate-900 text-white px-3 py-1 rounded md:col-span-1">Add Task</button>
          </form>
        </Card>
      </div>
      <Card title="Kanban">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['To Do','In Progress','Completed'].map(col => (
            <div key={col} className="bg-slate-50 border rounded p-3">
              <div className="font-medium mb-2">{col}</div>
              <div className="space-y-2">
                {tasks.filter(t=>t.status===col).map(t => (
                  <div key={t._id} className="bg-white border rounded p-2 text-sm">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500">Priority {t.priority}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SettingsPage() {
  const [s, setS] = useState({ company_name:'', language:'en', theme:'light' })
  const [users, setUsers] = useState([])
  useEffect(()=>{ SettingsAPI.get().then(setS); SettingsAPI.listUsers().then(setUsers).catch(()=>{}) }, [])
  function save(e){ e.preventDefault(); SettingsAPI.update(s).then(()=>alert('Saved')) }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card title="Company Settings">
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input placeholder="Company name" value={s.company_name||''} onChange={e=>setS({...s, company_name:e.target.value})} className="border rounded px-2 py-1"/>
          <select value={s.language} onChange={e=>setS({...s, language:e.target.value})} className="border rounded px-2 py-1"><option value="en">English</option><option value="fr">French</option></select>
          <select value={s.theme} onChange={e=>setS({...s, theme:e.target.value})} className="border rounded px-2 py-1"><option value="light">Light</option><option value="dark">Dark</option></select>
          <button className="bg-slate-900 text-white px-3 py-1 rounded md:col-span-1">Save</button>
        </form>
      </Card>
      <Card title="Users">
        <ul className="divide-y text-sm">
          {users.map(u => <li key={u._id} className="py-2 flex items-center justify-between"><div>{u.name} <span className="text-xs text-slate-500">· {u.role}</span></div><div className="text-xs text-slate-500">{u.email}</div></li>)}
        </ul>
      </Card>
    </div>
  )
}

function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const navigate = useNavigate()
  function submit(e){ e.preventDefault();
    // Try login, else register
    AuthAPI.login(email, password).then(res=>{
      if(res.token){ navigate('/') } else throw new Error('Login failed')
    }).catch(()=>{
      AuthAPI.register(name||'Admin', email, password).then(()=>navigate('/'))
    })
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border rounded p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Welcome</h1>
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Name (if new)" value={name} onChange={e=>setName(e.target.value)} className="border rounded px-3 py-2 w-full"/>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="border rounded px-3 py-2 w-full"/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="border rounded px-3 py-2 w-full"/>
          <button className="w-full bg-slate-900 text-white py-2 rounded">Continue</button>
        </form>
      </div>
    </div>
  )
}

function RequireAuth({ children }){
  const user = AuthAPI.me()
  const navigate = useNavigate()
  useEffect(()=>{ if(!user) navigate('/login') }, [])
  return user ? children : null
}

function AppRouter(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/" element={<RequireAuth><Layout><Dashboard/></Layout></RequireAuth>} />
        <Route path="/crm" element={<RequireAuth><Layout><CRM/></Layout></RequireAuth>} />
        <Route path="/quotes" element={<RequireAuth><Layout><Quotes/></Layout></RequireAuth>} />
        <Route path="/projects" element={<RequireAuth><Layout><Projects/></Layout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Layout><SettingsPage/></Layout></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
