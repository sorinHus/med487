import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../api'

const CULORI = ['#3a7bd5','#34d399','#fbbf24','#f87171','#a78bfa','#60a5fa']
const LUNI_RO = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: '600' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

function getUltimele6Luni() {
  const luni = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
    const start = d.toISOString().slice(0, 10)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    luni.push({ label: LUNI_RO[d.getMonth()], an: d.getFullYear(), start, end })
  }
  return luni
}

export default function Rapoarte() {
  const [consultatiiLuna, setConsultatiiLuna]   = useState([])
  const [programariStatus, setProgramariStatus] = useState([])
  const [pacientiNoi, setPacientiNoi]           = useState([])
  const [loading, setLoading]                   = useState(true)

  useEffect(() => {
    const luni = getUltimele6Luni()
    const fetchDate = async () => {
      setLoading(true)
      try {
        const consultatiiPromises = luni.map(l =>
          api.get('/consultatii/', { params: { data_dupa: l.start, data_inainte: l.end, page_size: 1 } })
            .then(res => ({ luna: l.label, consultatii: res.data.count ?? (Array.isArray(res.data) ? res.data.length : 0) }))
        )
        const programariPromise = api.get('/programari/').then(res => {
          const toate = Array.isArray(res.data) ? res.data : (res.data.results || [])
          const perStatus = {}
          toate.forEach(p => { perStatus[p.status] = (perStatus[p.status] || 0) + 1 })
          return Object.entries(perStatus).map(([status, total]) => ({ status, total }))
        })
        const pacientiPromise = api.get('/pacienti/', { params: { page_size: 500 } }).then(res => {
          const toti = Array.isArray(res.data) ? res.data : (res.data.results || [])
          return luni.map(l => ({
            luna: l.label,
            pacienti: toti.filter(p => p.data_inregistrare >= l.start && p.data_inregistrare <= l.end).length
          }))
        })
        const [consultatiiData, programariData, pacientiData] = await Promise.all([Promise.all(consultatiiPromises), programariPromise, pacientiPromise])
        setConsultatiiLuna(consultatiiData)
        setProgramariStatus(programariData)
        setPacientiNoi(pacientiData)
      } catch (err) { console.error('Eroare la incarcarea datelor grafice:', err) }
      finally { setLoading(false) }
    }
    fetchDate()
  }, [])

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }
  const titluStyle = { fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-dim)' }}>
      Se încarcă graficele...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={cardStyle}>
        <div style={titluStyle}>Consultații — ultimele 6 luni</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={consultatiiLuna} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="luna" tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<TooltipCustom />} cursor={{ fill: 'rgba(58,123,213,0.08)' }} />
            <Bar dataKey="consultatii" name="Consultații" fill="#3a7bd5" radius={[6,6,0,0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={titluStyle}>Pacienți noi — ultimele 6 luni</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={pacientiNoi} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="luna" tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<TooltipCustom />} />
              <Line type="monotone" dataKey="pacienti" name="Pacienți noi" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 4 }} activeDot={{ r: 6, fill: '#34d399' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={titluStyle}>Programări pe status</div>
          {programariStatus.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '13px', textAlign: 'center', paddingTop: '80px' }}>Nicio programare înregistrată.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={programariStatus} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'var(--text-dim)' }}>
                  {programariStatus.map((_, i) => <Cell key={i} fill={CULORI[i % CULORI.length]} />)}
                </Pie>
                <Tooltip content={<TooltipCustom />} />
                <Legend formatter={val => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}