import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ClipboardList, AlertTriangle, Calendar, Bell, X,
  ChevronRight, Clock, CheckCircle2, AlertCircle,
  Info, Wrench, MessageSquare, Users, FileText,
  ChevronDown, ChevronUp
} from 'lucide-react'

/* ─── Helpers ─── */
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/* ─── Badge stato segnalazione ─── */
function StatoBadge({ stato }) {
  const map = {
    'A': { label: 'Aperta',   bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    'I': { label: 'In corso', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    'C': { label: 'Chiusa',   bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400' },
  }
  const s = map[stato] || { label: stato || 'N/D', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

/* ─── Icona tipo segnalazione ─── */
function TipoIcon({ tipo }) {
  const map = {
    'Guasto':              { icon: Wrench,        color: 'text-red-600',    bg: 'bg-red-50' },
    'Problema':            { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50' },
    'Rich. Informazioni':  { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50' },
    'Segnalazione':        { icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
  }
  const t = map[tipo] || { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-50' }
  const Icon = t.icon
  return (
    <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-4.5 h-4.5 ${t.color}`} />
    </div>
  )
}

/* ─── SLIDE PANEL base ─── */
function SlidePanel({ onClose, children }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {children}
      </div>
    </>
  )
}

/* ─── PANEL SEGNALAZIONE ─── */
function SegnalazionePanel({ segnalazione, onClose }) {
  const [logs, setLogs] = useState([])
  const [interventi, setInterventi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [logRes, intRes] = await Promise.all([
        supabase.from('segnalazioni_log')
          .select('*')
          .eq('archivio_id', segnalazione.archivio_id)
          .eq('segnalazione_domustudio_id', segnalazione.domustudio_id)
          .order('data_log'),
        supabase.from('segnalazioni_interventi')
          .select('*')
          .eq('archivio_id', segnalazione.archivio_id)
          .eq('segnalazione_domustudio_id', segnalazione.domustudio_id)
          .order('data_intervento'),
      ])
      setLogs(logRes.data || [])
      setInterventi(intRes.data || [])
      setLoading(false)
    }
    load()
  }, [segnalazione])

  return (
    <SlidePanel onClose={onClose}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary px-6 py-5 flex items-start justify-between gap-3">
        <div className="text-white min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatoBadge stato={segnalazione.stato} />
            <span className="text-white/60 text-xs">{fmtDate(segnalazione.data_apertura)}</span>
          </div>
          <h2 className="font-bold text-lg leading-snug">{segnalazione.tipo_descrizione || 'Segnalazione'}</h2>
          {segnalazione.descrizione && (
            <p className="text-white/75 text-sm mt-1 leading-relaxed">{segnalazione.descrizione}</p>
          )}
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 bg-white/10 rounded-lg shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Log cronologico */}
            <PanelSection icon={Clock} title="Storico log" color="primary">
              {logs.length === 0 ? (
                <p className="px-4 py-3 text-sm text-text-muted">Nessun log disponibile</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {logs.map((log, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{fmtDateTime(log.data_log)}</span>
                        {log.stato && <StatoBadge stato={log.stato} />}
                      </div>
                      {log.note && <p className="text-sm text-text-primary">{log.note}</p>}
                      {log.operatore && <p className="text-xs text-text-muted mt-0.5">— {log.operatore}</p>}
                    </div>
                  ))}
                </div>
              )}
            </PanelSection>

            {/* Interventi */}
            <PanelSection icon={Wrench} title="Interventi" color="accent">
              {interventi.length === 0 ? (
                <p className="px-4 py-3 text-sm text-text-muted">Nessun intervento registrato</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {interventi.map((inv, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{fmtDate(inv.data_intervento)}</span>
                      </div>
                      {inv.descrizione && <p className="text-sm text-text-primary">{inv.descrizione}</p>}
                      {inv.fornitore && <p className="text-xs text-text-muted mt-0.5">Fornitore: {inv.fornitore}</p>}
                    </div>
                  ))}
                </div>
              )}
            </PanelSection>
          </>
        )}
      </div>
    </SlidePanel>
  )
}

/* ─── PANEL ASSEMBLEA ─── */
function AssembleaPanel({ assemblea, onClose }) {
  const [odg, setOdg] = useState([])
  const [presenti, setPresenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPresenti, setShowPresenti] = useState(false)

  useEffect(() => {
    async function load() {
      const [odgRes, presRes] = await Promise.all([
        supabase.from('assemblee_odg')
          .select('*')
          .eq('archivio_id', assemblea.archivio_id)
          .eq('assemblea_domustudio_id', assemblea.domustudio_id)
          .order('numero'),
        supabase.from('assemblee_presenti')
          .select('*')
          .eq('archivio_id', assemblea.archivio_id)
          .eq('assemblea_domustudio_id', assemblea.domustudio_id),
      ])
      setOdg(odgRes.data || [])
      setPresenti(presRes.data || [])
      setLoading(false)
    }
    load()
  }, [assemblea])

  return (
    <SlidePanel onClose={onClose}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary px-6 py-5 flex items-start justify-between gap-3">
        <div className="text-white min-w-0">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">{assemblea.tipo || 'Assemblea'}</p>
          <h2 className="font-bold text-xl">{fmtDate(assemblea.data_assemblea)}</h2>
          {assemblea.luogo && <p className="text-white/70 text-sm mt-1">{assemblea.luogo}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1 text-xs font-bold text-white">
              <Users className="w-3.5 h-3.5" />
              {presenti.length} presenti
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 bg-white/10 rounded-lg shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ODG */}
            <PanelSection icon={FileText} title="Ordine del giorno" color="primary">
              {odg.length === 0 ? (
                <p className="px-4 py-3 text-sm text-text-muted">Nessun punto ODG</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {odg.map((punto, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {punto.numero || i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{punto.descrizione}</p>
                        {punto.note && <p className="text-xs text-text-muted mt-0.5">{punto.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelSection>

            {/* Presenti collassabile */}
            <div className="rounded-xl border border-accent/30 overflow-hidden">
              <button
                onClick={() => setShowPresenti(v => !v)}
                className="w-full bg-accent px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Presenti ({presenti.length})</h3>
                </div>
                {showPresenti
                  ? <ChevronUp className="w-4 h-4 text-white" />
                  : <ChevronDown className="w-4 h-4 text-white" />
                }
              </button>
              {showPresenti && (
                <div className="bg-white divide-y divide-border/30 max-h-64 overflow-y-auto">
                  {presenti.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-text-muted">Nessun presente registrato</p>
                  ) : presenti.map((p, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm text-text-primary font-medium">{p.descrizione || p.anagrafica_domustudio_id}</span>
                      {p.delegato && <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">Delegato</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SlidePanel>
  )
}

/* ─── Panel section helper ─── */
function PanelSection({ icon: Icon, title, color = 'primary', children }) {
  const colors = {
    primary: { header: 'bg-primary', icon: 'text-white', text: 'text-white', border: 'border-primary/20' },
    accent:  { header: 'bg-accent',  icon: 'text-white', text: 'text-white', border: 'border-accent/20' },
  }
  const c = colors[color]
  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <div className={`${c.header} px-4 py-2.5 flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${c.icon}`} />
        <h3 className={`text-sm font-bold ${c.text} uppercase tracking-wide`}>{title}</h3>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  )
}

/* ─── TAB SEGNALAZIONI ─── */
function TabSegnalazioni({ archivioIds }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('tutte')
  const [selected, setSelected] = useState(null)
  const [tipiMap, setTipiMap] = useState({})

  useEffect(() => { load() }, [archivioIds])

  async function load() {
    setLoading(true)
    const [segRes, tipiRes] = await Promise.all([
      supabase.from('segnalazioni')
        .select('*')
        .in('archivio_id', archivioIds)
        .order('data_apertura', { ascending: false }),
      supabase.from('segnalazioni_tipo')
        .select('*')
        .in('archivio_id', archivioIds),
    ])
    const map = {}
    for (const t of (tipiRes.data || [])) map[t.domustudio_id] = t.descrizione
    setTipiMap(map)
    const enriched = (segRes.data || []).map(s => ({
      ...s,
      tipo_descrizione: map[s.tipo_domustudio_id] || 'N/D'
    }))
    setItems(enriched)
    setLoading(false)
  }

  const filtered = filtro === 'tutte' ? items : items.filter(i => {
    if (filtro === 'aperte') return i.stato === 'A' || i.stato === 'I'
    if (filtro === 'chiuse') return i.stato === 'C'
    return true
  })

  const pillBase = 'px-4 py-1.5 rounded-full text-xs font-bold transition-colors'
  const pillActive = 'bg-primary text-white'
  const pillInactive = 'bg-white text-text-secondary border border-border hover:border-primary/30 hover:text-primary'

  return (
    <>
      {/* Filtri */}
      <div className="flex gap-2 mb-5">
        {[['tutte','Tutte'],['aperte','Aperte'],['chiuse','Chiuse']].map(([val, label]) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`${pillBase} ${filtro === val ? pillActive : pillInactive}`}>
            {label}
            {val === 'tutte' && <span className="ml-1.5 opacity-70">{items.length}</span>}
            {val === 'aperte' && <span className="ml-1.5 opacity-70">{items.filter(i => i.stato === 'A' || i.stato === 'I').length}</span>}
            {val === 'chiuse' && <span className="ml-1.5 opacity-70">{items.filter(i => i.stato === 'C').length}</span>}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon={AlertTriangle} label="Nessuna segnalazione trovata" />
      ) : (
        <div className="space-y-3">
          {filtered.map((seg) => (
            <button
              key={seg.id}
              onClick={() => setSelected(seg)}
              className="w-full bg-white rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all p-4 text-left group"
            >
              <div className="flex items-start gap-3">
                <TipoIcon tipo={seg.tipo_descrizione} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-bold text-text-primary truncate">{seg.tipo_descrizione}</span>
                    <StatoBadge stato={seg.stato} />
                  </div>
                  {seg.descrizione && (
                    <p className="text-sm text-text-secondary line-clamp-2 mb-2">{seg.descrizione}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {fmtDate(seg.data_apertura)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <SegnalazionePanel segnalazione={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

/* ─── TAB ASSEMBLEE ─── */
function TabAssemblee({ archivioIds }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { load() }, [archivioIds])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('assemblee')
      .select('*')
      .in('archivio_id', archivioIds)
      .order('data_assemblea', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  // Contiamo i presenti per ogni assemblea
  const [presentiMap, setPresentiMap] = useState({})
  useEffect(() => {
    if (!items.length) return
    async function loadPresenti() {
      const ids = items.map(a => a.domustudio_id)
      const { data } = await supabase
        .from('assemblee_presenti')
        .select('assemblea_domustudio_id')
        .in('archivio_id', archivioIds)
        .in('assemblea_domustudio_id', ids)
      const map = {}
      for (const p of (data || [])) {
        map[p.assemblea_domustudio_id] = (map[p.assemblea_domustudio_id] || 0) + 1
      }
      setPresentiMap(map)
    }
    loadPresenti()
  }, [items])

  return (
    <>
      {loading ? <Spinner /> : items.length === 0 ? (
        <Empty icon={Calendar} label="Nessuna assemblea trovata" />
      ) : (
        <div className="space-y-3">
          {items.map((ass) => {
            const nPresenti = presentiMap[ass.domustudio_id] || 0
            return (
              <button
                key={ass.id}
                onClick={() => setSelected(ass)}
                className="w-full bg-white rounded-xl border border-border/60 hover:border-primary/30 hover:shadow-md transition-all p-4 text-left group"
              >
                <div className="flex items-center gap-4">
                  {/* Data box */}
                  <div className="w-14 shrink-0 text-center bg-primary/8 rounded-xl py-2 px-1 border border-primary/15">
                    <p className="text-xl font-black text-primary leading-none">
                      {new Date(ass.data_assemblea).getDate().toString().padStart(2,'0')}
                    </p>
                    <p className="text-xs font-bold text-primary/60 uppercase mt-0.5">
                      {new Date(ass.data_assemblea).toLocaleDateString('it-IT', { month: 'short' })}
                    </p>
                    <p className="text-xs text-primary/50">
                      {new Date(ass.data_assemblea).getFullYear()}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text-primary">{ass.tipo || 'Assemblea ordinaria'}</span>
                    </div>
                    {ass.luogo && <p className="text-xs text-text-muted mb-1.5">{ass.luogo}</p>}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        {nPresenti} presenti
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <AssembleaPanel assemblea={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

/* ─── TAB PROMEMORIA ─── */
function TabPromemoria({ archivioIds }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [archivioIds])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('promemoria')
      .select('*')
      .in('archivio_id', archivioIds)
      .order('data_scadenza')
    setItems(data || [])
    setLoading(false)
  }

  const oggi = new Date()
  const nonEseguiti = items.filter(p => !p.eseguito).sort((a, b) => {
    if (!a.data_scadenza) return 1
    if (!b.data_scadenza) return -1
    return new Date(a.data_scadenza) - new Date(b.data_scadenza)
  })
  const eseguiti = items.filter(p => p.eseguito)

  function scadenzaStatus(p) {
    if (p.eseguito) return 'done'
    if (!p.data_scadenza) return 'none'
    const scad = new Date(p.data_scadenza)
    const diff = Math.ceil((scad - oggi) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'scaduto'
    if (diff <= 7) return 'urgente'
    return 'ok'
  }

  const statusStyle = {
    done:    { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
    scaduto: { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
    urgente: { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
    ok:      { bg: 'bg-white',     border: 'border-border/60',  badge: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400' },
    none:    { bg: 'bg-white',     border: 'border-border/60',  badge: 'bg-slate-100 text-slate-500',  dot: 'bg-slate-300' },
  }

  function PromemoriaCard({ p }) {
    const st = scadenzaStatus(p)
    const style = statusStyle[st]
    const label = st === 'done' ? 'Eseguito' : st === 'scaduto' ? 'Scaduto' : st === 'urgente' ? 'In scadenza' : p.data_scadenza ? 'Programmato' : 'Senza scadenza'

    return (
      <div className={`rounded-xl border ${style.border} ${style.bg} p-4 flex items-start gap-3`}>
        <div className={`w-2 h-2 rounded-full ${style.dot} mt-2 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${p.eseguito ? 'text-text-muted line-through' : 'text-text-primary'} leading-snug`}>
              {p.descrizione || p.oggetto || 'Promemoria'}
            </p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>{label}</span>
          </div>
          {p.data_scadenza && (
            <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scadenza: {fmtDate(p.data_scadenza)}
            </p>
          )}
          {p.note && <p className="text-xs text-text-secondary mt-1">{p.note}</p>}
        </div>
        {p.eseguito && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
      </div>
    )
  }

  return (
    <>
      {loading ? <Spinner /> : items.length === 0 ? (
        <Empty icon={Bell} label="Nessun promemoria trovato" />
      ) : (
        <div className="space-y-4">
          {nonEseguiti.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Da fare ({nonEseguiti.length})</p>
              {nonEseguiti.map(p => <PromemoriaCard key={p.id} p={p} />)}
            </div>
          )}
          {eseguiti.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-2">Completati ({eseguiti.length})</p>
              {eseguiti.map(p => <PromemoriaCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* ─── Spinner / Empty ─── */
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
}
function Empty({ icon: Icon, label }) {
  return (
    <div className="bg-white rounded-xl border border-border/50 p-12 text-center">
      <Icon className="w-10 h-10 text-text-muted mx-auto mb-3" />
      <p className="text-text-secondary font-medium text-sm">{label}</p>
    </div>
  )
}

/* ─── PAGE ─── */
export default function AttivitaPage() {
  const { studio } = useAuth()
  const [activeTab, setActiveTab] = useState('segnalazioni')
  const [archivioIds, setArchivioIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studio) loadArchivi()
  }, [studio])

  async function loadArchivi() {
    const { data } = await supabase
      .from('archivi')
      .select('id')
      .eq('studio_id', studio.studio_id)
    setArchivioIds((data || []).map(a => a.id))
    setLoading(false)
  }

  const tabs = [
    { id: 'segnalazioni', label: 'Segnalazioni', icon: AlertTriangle },
    { id: 'assemblee',    label: 'Assemblee',    icon: Calendar },
    { id: 'promemoria',   label: 'Promemoria',   icon: Bell },
  ]

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Attività</h1>
        <p className="text-text-secondary text-sm mt-1">Segnalazioni, assemblee e promemoria dei tuoi condomini</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface border border-border/50 rounded-xl p-1 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenuto tab */}
      {archivioIds.length === 0 ? (
        <Empty icon={ClipboardList} label="Nessun archivio trovato. Sincronizza i dati dalle Impostazioni." />
      ) : (
        <>
          {activeTab === 'segnalazioni' && <TabSegnalazioni archivioIds={archivioIds} />}
          {activeTab === 'assemblee'    && <TabAssemblee    archivioIds={archivioIds} />}
          {activeTab === 'promemoria'   && <TabPromemoria   archivioIds={archivioIds} />}
        </>
      )}
    </div>
  )
}
