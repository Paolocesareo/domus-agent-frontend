import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Building2, MapPin, Home, Users, ArrowLeft, X,
  Phone, Mail, Shield, User, FileText, MapPinned,
  Search, ChevronUp, ChevronDown, MessageCircle, Wallet, Send
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
/* ─── Pannello laterale dettaglio condomino ─── */
function DetailPanel({ unita, proprietario, conduttore, edificio, onClose }) {
  const [rateDetail, setRateDetail] = useState([])
  const [loadingRate, setLoadingRate] = useState(true)
  const [whatsappMode, setWhatsappMode] = useState(null)
  const [customMsg, setCustomMsg] = useState('')

  if (!unita) return null

  const nome = proprietario?.descrizione || 'N/D'
  const rawPhone = proprietario?.telefono1 || proprietario?.telefono2 || proprietario?.telefono3 || ''
  const cleanPhone = rawPhone.replace(/[\s\-\.]/g, '').replace(/^0/, '+390').replace(/^3/, '+393')

  useEffect(() => {
    if (proprietario) loadRate()
    else setLoadingRate(false)
  }, [proprietario])

  async function loadRate() {
    setLoadingRate(true)
    try {
      const { data } = await supabase
        .from('rate_importi')
        .select('importo, rata_domustudio_id')
        .eq('archivio_id', unita.archivio_id)
        .eq('unita_domustudio_id', unita.domustudio_id)
        .eq('anagrafica_domustudio_id', proprietario.domustudio_id)

      if (data?.length) {
        const rataIds = [...new Set(data.map(d => d.rata_domustudio_id))]
        const { data: rateData } = await supabase
          .from('rate')
          .select('domustudio_id, data_rata, descrizione')
          .eq('archivio_id', unita.archivio_id)
          .in('domustudio_id', rataIds)
          .order('data_rata')

        const rataMap = {}
        for (const r of (rateData || [])) rataMap[r.domustudio_id] = r

        const merged = data.map(d => ({
          importo: parseFloat(d.importo) || 0,
          data_rata: rataMap[d.rata_domustudio_id]?.data_rata || '',
          descrizione: rataMap[d.rata_domustudio_id]?.descrizione || '',
        })).sort((a, b) => (a.data_rata || '').localeCompare(b.data_rata || ''))

        setRateDetail(merged)
      }
    } catch (err) {
      console.error('Errore rate:', err)
    } finally {
      setLoadingRate(false)
    }
  }

  const totaleDovuto = rateDetail.reduce((s, r) => s + r.importo, 0)
  const edificioNome = edificio?.intestazione || ''

  function fmtDate(d) {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  function fmtEur(v) {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v)
  }

  function buildSollecitoMsg() {
    const scadute = rateDetail.filter(r => r.data_rata && new Date(r.data_rata) < new Date())
    const tot = scadute.reduce((s, r) => s + r.importo, 0)
    return `Gentile ${nome},\n\nle comunichiamo che risultano rate condominiali non ancora saldate per il ${edificioNome}.\n\nImporto totale dovuto: ${fmtEur(tot)}\n\nLa preghiamo di provvedere al pagamento quanto prima.\n\nCordiali saluti,\nAmministrazione Condominiale`
  }

  function buildEstrattoMsg() {
    let msg = `Gentile ${nome},\n\ndi seguito il riepilogo delle rate condominiali per il ${edificioNome}:\n\n`
    for (const r of rateDetail) {
      msg += `${fmtDate(r.data_rata)} - ${r.descrizione}: ${fmtEur(r.importo)}\n`
    }
    msg += `\nTOTALE: ${fmtEur(totaleDovuto)}\n\nCordiali saluti,\nAmministrazione Condominiale`
    return msg
  }

  function openWhatsApp(text) {
    if (!cleanPhone) { alert('Nessun numero di telefono disponibile'); return }
    const phone = cleanPhone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-primary px-5 py-5 flex items-center justify-between z-10">
          <div className="text-white min-w-0">
            <h2 className="font-bold text-lg truncate">{nome}</h2>
            <p className="text-white/70 text-sm mt-1 font-medium">
              Sub. {unita.subalterno || '-'} · Int. {unita.interno || '-'} · Piano {unita.piano || '-'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Section icon={Home} title="Unità" color="primary">
            <Row label="Subalterno" value={unita.subalterno} />
            <Row label="Interno" value={unita.interno} />
            <Row label="Piano" value={unita.piano} />
            <Row label="Scala" value={unita.scala} />
            <Row label="Tipo" value={unita.tipo} />
            {unita.millesimi_proprieta && <Row label="Millesimi" value={unita.millesimi_proprieta} />}
          </Section>

          {proprietario && (
            <Section icon={User} title="Proprietario" color="accent">
              <Row label="Nome" value={proprietario.descrizione} bold />
              <Row label="Codice Fiscale" value={proprietario.codice_fiscale} />
              <Row label="P. IVA" value={proprietario.partita_iva} />
              <Row label="Indirizzo" value={[proprietario.indirizzo, proprietario.citta, proprietario.cap, proprietario.provincia].filter(Boolean).join(', ')} />
              <Row label="Telefono" value={proprietario.telefono1} link={proprietario.telefono1 ? `tel:${proprietario.telefono1}` : null} />
              <Row label="Telefono 2" value={proprietario.telefono2} link={proprietario.telefono2 ? `tel:${proprietario.telefono2}` : null} />
              <Row label="Telefono 3" value={proprietario.telefono3} link={proprietario.telefono3 ? `tel:${proprietario.telefono3}` : null} />
              <Row label="Email" value={proprietario.email} link={proprietario.email ? `mailto:${proprietario.email}` : null} />
              <Row label="PEC" value={proprietario.pec} link={proprietario.pec ? `mailto:${proprietario.pec}` : null} />
            </Section>
          )}

          {conduttore && (
            <Section icon={Shield} title="Conduttore" color="success">
              <Row label="Nome" value={conduttore.descrizione} bold />
              <Row label="Codice Fiscale" value={conduttore.codice_fiscale} />
              <Row label="Telefono" value={conduttore.telefono1} link={conduttore.telefono1 ? `tel:${conduttore.telefono1}` : null} />
              <Row label="Email" value={conduttore.email} link={conduttore.email ? `mailto:${conduttore.email}` : null} />
            </Section>
          )}

          {/* SITUAZIONE RATE */}
          <div className="rounded-xl border border-red-200 overflow-hidden">
            <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Situazione Rate</h3>
              </div>
              {!loadingRate && totaleDovuto > 0 && (
                <span className="text-white font-bold text-sm">{fmtEur(totaleDovuto)}</span>
              )}
            </div>
            <div className="bg-white">
              {loadingRate ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : rateDetail.length === 0 ? (
                <p className="p-4 text-sm text-text-muted text-center">Nessuna rata trovata</p>
              ) : (
                <div className="divide-y divide-border/20">
                  {rateDetail.map((r, i) => {
                    const scaduta = r.data_rata && new Date(r.data_rata) < new Date()
                    return (
                      <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${scaduta ? 'bg-red-50' : ''}`}>
                        <div>
                          <p className={`text-sm font-medium ${scaduta ? 'text-red-700' : 'text-text-primary'}`}>{r.descrizione}</p>
                          <p className="text-xs text-text-muted">{fmtDate(r.data_rata)}</p>
                        </div>
                        <span className={`text-sm font-bold ${scaduta ? 'text-red-700' : 'text-text-primary'}`}>
                          {fmtEur(r.importo)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* WHATSAPP */}
          {totaleDovuto > 0 && (
            <div className="rounded-xl border border-green-300 overflow-hidden">
              <div className="bg-green-600 px-4 py-2.5 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">WhatsApp</h3>
              </div>
              <div className="bg-white p-4 space-y-2.5">
                {!cleanPhone && (
                  <p className="text-xs text-red-600 font-medium mb-2">Nessun numero di telefono disponibile</p>
                )}
                <button
                  onClick={() => openWhatsApp(buildSollecitoMsg())}
                  disabled={!cleanPhone}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Sollecito pagamento
                  <span className="ml-auto text-green-200 text-xs font-medium">{fmtEur(totaleDovuto)}</span>
                </button>
                <button
                  onClick={() => openWhatsApp(buildEstrattoMsg())}
                  disabled={!cleanPhone}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold text-sm hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Invia estratto conto
                </button>
                <button
                  onClick={() => setWhatsappMode(whatsappMode === 'custom' ? null : 'custom')}
                  disabled={!cleanPhone}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white text-green-700 border border-green-200 font-semibold text-sm hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  Messaggio personalizzato
                </button>
                {whatsappMode === 'custom' && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={customMsg}
                      onChange={e => setCustomMsg(e.target.value)}
                      placeholder={`Gentile ${nome},\n\n...`}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-green-200 rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200"
                    />
                    <button
                      onClick={() => openWhatsApp(customMsg)}
                      disabled={!customMsg.trim()}
                      className="w-full px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40"
                    >
                      Invia su WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const SECTION_COLORS = {
  primary: { bg: 'bg-primary', text: 'text-white', icon: 'text-white', border: 'border-primary/20' },
  accent: { bg: 'bg-accent', text: 'text-white', icon: 'text-white', border: 'border-accent/20' },
  success: { bg: 'bg-success', text: 'text-white', icon: 'text-white', border: 'border-success/20' },
}

function Section({ icon: Icon, title, color = 'primary', children }) {
  const c = SECTION_COLORS[color]
  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <div className={`${c.bg} px-4 py-2.5 flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${c.icon}`} />
        <h3 className={`text-sm font-bold ${c.text} uppercase tracking-wide`}>{title}</h3>
      </div>
      <div className="divide-y divide-border/30 bg-white">{children}</div>
    </div>
  )
}

function Row({ label, value, link, bold }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start px-4 py-2.5 gap-4">
      <span className="text-xs font-semibold text-text-secondary shrink-0 uppercase tracking-wide">{label}</span>
      {link ? (
        <a href={link} className="text-sm text-primary font-bold text-right truncate hover:underline">{value}</a>
      ) : (
        <span className={`text-sm text-text-primary text-right truncate ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
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
          edificio={edificio}
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
