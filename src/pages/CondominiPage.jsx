import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Building2, MapPin, Home, Users, ArrowLeft, X,
  Phone, Mail, Shield, User, FileText, MapPinned,
  Search, ChevronUp, ChevronDown
} from 'lucide-react'

/* ─── Lista condomini ─── */
function CondominiList({ edifici, onSelect }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Condomini</h1>
        <p className="text-text-secondary text-sm mt-1">Tutti i condomini gestiti dal tuo studio</p>
      </div>

      {edifici.length === 0 ? (
        <div className="bg-surface-card rounded-xl p-12 text-center border border-border/50">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">Nessun condominio trovato</p>
          <p className="text-text-muted text-sm mt-1">Sincronizza i dati dalle Impostazioni</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {edifici.map((ed) => (
            <button
              key={ed.id}
              onClick={() => onSelect(ed)}
              className="bg-surface-card rounded-xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-left w-full"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary text-sm leading-tight">
                    {ed.intestazione || 'Senza nome'}
                  </h3>
                  {ed.indirizzo && (
                    <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {ed.indirizzo}{ed.citta ? `, ${ed.citta}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-text-muted text-xs">
                  <Home className="w-3.5 h-3.5" />
                  <span>{ed.unita_count} unità</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>{ed.proprietari_count} condomini</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ─── Pannello laterale dettaglio condomino ─── */
function DetailPanel({ unita, proprietario, conduttore, onClose }) {
  if (!unita) return null

  const nome = proprietario?.descrizione || 'N/D'

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-card shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-primary px-5 py-4 flex items-center justify-between z-10">
          <div className="text-white min-w-0">
            <h2 className="font-bold text-base truncate">{nome}</h2>
            <p className="text-white/60 text-xs mt-0.5">
              Sub. {unita.subalterno || '-'} · Int. {unita.interno || '-'} · Piano {unita.piano || '-'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Unità */}
          <Section icon={Home} title="Unità">
            <Row label="Subalterno" value={unita.subalterno} />
            <Row label="Interno" value={unita.interno} />
            <Row label="Piano" value={unita.piano} />
            <Row label="Scala" value={unita.scala} />
            <Row label="Tipo" value={unita.tipo} />
            {unita.millesimi_proprieta && <Row label="Millesimi" value={unita.millesimi_proprieta} />}
            {unita.note && <Row label="Note" value={unita.note} />}
          </Section>

          {/* Proprietario */}
          {proprietario && (
            <Section icon={User} title="Proprietario">
              <Row label="Nome" value={proprietario.descrizione} />
              <Row label="Codice Fiscale" value={proprietario.codice_fiscale} />
              <Row label="P. IVA" value={proprietario.partita_iva} />
              <Row label="Indirizzo" value={[proprietario.indirizzo, proprietario.citta, proprietario.cap, proprietario.provincia].filter(Boolean).join(', ')} />
              <Row label="Telefono" value={proprietario.telefono1} link={proprietario.telefono1 ? `tel:${proprietario.telefono1}` : null} />
              <Row label="Telefono 2" value={proprietario.telefono2} link={proprietario.telefono2 ? `tel:${proprietario.telefono2}` : null} />
              <Row label="Telefono 3" value={proprietario.telefono3} link={proprietario.telefono3 ? `tel:${proprietario.telefono3}` : null} />
              <Row label="Email" value={proprietario.email} link={proprietario.email ? `mailto:${proprietario.email}` : null} />
              <Row label="PEC" value={proprietario.pec} link={proprietario.pec ? `mailto:${proprietario.pec}` : null} />
              {proprietario.note && <Row label="Note" value={proprietario.note} />}
            </Section>
          )}

          {/* Conduttore */}
          {conduttore && (
            <Section icon={Shield} title="Conduttore">
              <Row label="Nome" value={conduttore.descrizione} />
              <Row label="Codice Fiscale" value={conduttore.codice_fiscale} />
              <Row label="Indirizzo" value={[conduttore.indirizzo, conduttore.citta, conduttore.cap].filter(Boolean).join(', ')} />
              <Row label="Telefono" value={conduttore.telefono1} link={conduttore.telefono1 ? `tel:${conduttore.telefono1}` : null} />
              <Row label="Email" value={conduttore.email} link={conduttore.email ? `mailto:${conduttore.email}` : null} />
              <Row label="PEC" value={conduttore.pec} link={conduttore.pec ? `mailto:${conduttore.pec}` : null} />
            </Section>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      <div className="bg-surface rounded-lg divide-y divide-border/30">{children}</div>
    </div>
  )
}

function Row({ label, value, link }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start px-3 py-2 gap-3">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      {link ? (
        <a href={link} className="text-xs text-primary font-medium text-right truncate hover:underline">{value}</a>
      ) : (
        <span className="text-xs text-text-primary font-medium text-right truncate">{value}</span>
      )}
    </div>
  )
}

/* ─── Dettaglio edificio: tabella stile Danea ─── */
function CondominiDettaglio({ edificio, onBack }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function getValue(row, col) {
    if (col === 'interno') return row.unita.interno || ''
    if (col === 'piano') return row.unita.piano || ''
    if (col === 'subalterno') return row.unita.subalterno || ''
    if (col === 'proprietario') return row.proprietario?.descrizione || ''
    if (col === 'conduttore') return row.conduttore?.descrizione || ''
    return ''
  }

  function getFilteredSorted() {
    let filtered = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = rows.filter(r =>
        (r.proprietario?.descrizione || '').toLowerCase().includes(q) ||
        (r.conduttore?.descrizione || '').toLowerCase().includes(q) ||
        (r.unita.interno || '').toLowerCase().includes(q) ||
        (r.unita.subalterno || '').toLowerCase().includes(q) ||
        (r.unita.piano || '').toLowerCase().includes(q) ||
        (r.unita.scala || '').toLowerCase().includes(q)
      )
    }
    if (sortCol) {
      filtered = [...filtered].sort((a, b) => {
        let va = getValue(a, sortCol)
        let vb = getValue(b, sortCol)
        // prova numerico
        const na = parseFloat(va), nb = parseFloat(vb)
        if (!isNaN(na) && !isNaN(nb)) {
          return sortDir === 'asc' ? na - nb : nb - na
        }
        return sortDir === 'asc' ? va.localeCompare(vb, 'it') : vb.localeCompare(va, 'it')
      })
    }
    return filtered
  }

  useEffect(() => { loadDettaglio() }, [edificio])

  async function loadDettaglio() {
    setLoading(true)
    try {
      // Prendi tutte le unità
      const { data: unitaData } = await supabase
        .from('unita')
        .select('*')
        .eq('archivio_id', edificio.archivio_id)
        .eq('edificio_domustudio_id', edificio.domustudio_id)
        .order('subalterno')

      // Prendi tutti i proprietari per queste unità
      const unitaIds = (unitaData || []).map(u => u.domustudio_id)
      const { data: propData } = await supabase
        .from('proprietari')
        .select('*')
        .eq('archivio_id', edificio.archivio_id)
        .in('unita_domustudio_id', unitaIds)

      // Prendi tutti i conduttori
      const { data: condData } = await supabase
        .from('conduttori')
        .select('*')
        .eq('archivio_id', edificio.archivio_id)
        .in('unita_domustudio_id', unitaIds)

      // Raccogli tutti gli ID anagrafica
      const anagIds = new Set()
      for (const p of (propData || [])) anagIds.add(p.anagrafica_domustudio_id)
      for (const c of (condData || [])) anagIds.add(c.anagrafica_domustudio_id)

      const { data: anagData } = await supabase
        .from('anagrafiche')
        .select('*')
        .eq('archivio_id', edificio.archivio_id)
        .in('domustudio_id', [...anagIds])

      const anagMap = {}
      for (const a of (anagData || [])) anagMap[a.domustudio_id] = a

      const propMap = {}
      for (const p of (propData || [])) propMap[p.unita_domustudio_id] = anagMap[p.anagrafica_domustudio_id] || null

      const condMap = {}
      for (const c of (condData || [])) condMap[c.unita_domustudio_id] = anagMap[c.anagrafica_domustudio_id] || null

      const merged = (unitaData || []).map(u => ({
        unita: u,
        proprietario: propMap[u.domustudio_id] || null,
        conduttore: condMap[u.domustudio_id] || null,
      }))

      setRows(merged)
    } catch (err) {
      console.error('Errore dettaglio:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Tutti i condomini
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{edificio.intestazione}</h1>
            {edificio.indirizzo && (
              <p className="text-text-muted text-xs mt-0.5">
                {edificio.indirizzo}{edificio.citta ? `, ${edificio.citta}` : ''}{edificio.cap ? ` ${edificio.cap}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats compatte con colore */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3.5 py-2">
          <Home className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">{rows.length}</span>
          <span className="text-xs text-primary/70">unità</span>
        </div>
        <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3.5 py-2">
          <Users className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-accent">{rows.filter(r => r.proprietario).length}</span>
          <span className="text-xs text-accent/70">proprietari</span>
        </div>
        <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3.5 py-2">
          <Shield className="w-4 h-4 text-success" />
          <span className="text-sm font-bold text-success">{rows.filter(r => r.conduttore).length}</span>
          <span className="text-xs text-success/70">conduttori</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Ricerca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per nome, interno, piano..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-card border border-border/50 rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Tabella */}
          {(() => {
            const filtered = getFilteredSorted()
            const SortIcon = ({ col }) => {
              if (sortCol !== col) return <ChevronDown className="w-3 h-3 text-white/30" />
              return sortDir === 'asc'
                ? <ChevronUp className="w-3 h-3 text-accent" />
                : <ChevronDown className="w-3 h-3 text-accent" />
            }
            return (
              <div className="bg-surface-card rounded-xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white border-b border-primary-dark">
                        <th onClick={() => handleSort('subalterno')} className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:text-white select-none">
                          <span className="inline-flex items-center gap-1">Sub. <SortIcon col="subalterno" /></span>
                        </th>
                        <th className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap">Tipo</th>
                        <th onClick={() => handleSort('interno')} className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:text-white select-none">
                          <span className="inline-flex items-center gap-1">Int. <SortIcon col="interno" /></span>
                        </th>
                        <th onClick={() => handleSort('piano')} className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:text-white select-none">
                          <span className="inline-flex items-center gap-1">Piano <SortIcon col="piano" /></span>
                        </th>
                        <th className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap">Scala</th>
                        <th onClick={() => handleSort('proprietario')} className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:text-white select-none min-w-[200px]">
                          <span className="inline-flex items-center gap-1">Proprietario <SortIcon col="proprietario" /></span>
                        </th>
                        <th onClick={() => handleSort('conduttore')} className="text-left px-3 py-2.5 font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:text-white select-none min-w-[200px]">
                          <span className="inline-flex items-center gap-1">Conduttore <SortIcon col="conduttore" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filtered.length === 0 ? (
                        <tr><td colSpan={7} className="px-3 py-6 text-center text-text-muted">Nessun risultato</td></tr>
                      ) : filtered.map((row, i) => (
                        <tr
                          key={row.unita.id}
                          onClick={() => setSelected(row)}
                          className={`cursor-pointer transition-colors ${
                            i % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'
                          } hover:bg-accent/10`}
                        >
                          <td className="px-3 py-2.5 text-text-primary font-semibold whitespace-nowrap">{row.unita.subalterno || '-'}</td>
                          <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">{row.unita.tipo || '-'}</td>
                          <td className="px-3 py-2.5 text-text-primary font-semibold whitespace-nowrap">{row.unita.interno || '-'}</td>
                          <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">{row.unita.piano || '-'}</td>
                          <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">{row.unita.scala || '-'}</td>
                          <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-[250px]">
                            {row.proprietario?.descrizione || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-text-primary truncate max-w-[200px]">
                            {row.conduttore?.descrizione || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Footer conteggio */}
                <div className="px-3 py-2 border-t border-border/30 text-xs text-text-muted">
                  {filtered.length} di {rows.length} unità
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Pannello laterale */}
      {selected && (
        <DetailPanel
          unita={selected.unita}
          proprietario={selected.proprietario}
          conduttore={selected.conduttore}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

/* ─── Page ─── */
export default function CondominiPage() {
  const { studio } = useAuth()
  const [edifici, setEdifici] = useState([])
  const [selectedEdificio, setSelectedEdificio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studio) loadEdifici()
  }, [studio])

  async function loadEdifici() {
    try {
      const { data: archivi } = await supabase
        .from('archivi')
        .select('id')
        .eq('studio_id', studio.studio_id)

      if (!archivi?.length) { setLoading(false); return }
      const archivioIds = archivi.map(a => a.id)

      const { data } = await supabase
        .from('edifici')
        .select('*')
        .in('archivio_id', archivioIds)
        .order('intestazione')

      const enriched = await Promise.all(
        (data || []).map(async (ed) => {
          const [uRes, pRes] = await Promise.all([
            supabase.from('unita').select('id', { count: 'exact', head: true })
              .eq('archivio_id', ed.archivio_id).eq('edificio_domustudio_id', ed.domustudio_id),
            supabase.from('proprietari').select('id', { count: 'exact', head: true })
              .eq('archivio_id', ed.archivio_id),
          ])
          return { ...ed, unita_count: uRes.count || 0, proprietari_count: pRes.count || 0 }
        })
      )
      setEdifici(enriched)
    } catch (err) {
      console.error('Errore:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px]">
      {selectedEdificio ? (
        <CondominiDettaglio edificio={selectedEdificio} onBack={() => setSelectedEdificio(null)} />
      ) : (
        <CondominiList edifici={edifici} onSelect={setSelectedEdificio} />
      )}
    </div>
  )
}
