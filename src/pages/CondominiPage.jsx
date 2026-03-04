import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Building2, MapPin, Home, Users, ArrowLeft, User, Phone, Mail } from 'lucide-react'

function CondominiList({ edifici, onSelect }) {
  return (
    <>
      <div className="mb-8">
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

function CondominiDettaglio({ edificio, onBack }) {
  const [unita, setUnita] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDettaglio()
  }, [edificio])

  async function loadDettaglio() {
    setLoading(true)
    try {
      // Prendi unità di questo edificio
      const { data: unitaData } = await supabase
        .from('unita')
        .select('*')
        .eq('archivio_id', edificio.archivio_id)
        .eq('edificio_domustudio_id', edificio.domustudio_id)
        .order('interno')

      // Per ogni unità prendi il proprietario
      const unitaConProprietari = await Promise.all(
        (unitaData || []).map(async (u) => {
          const { data: propData } = await supabase
            .from('proprietari')
            .select('anagrafica_domustudio_id')
            .eq('archivio_id', u.archivio_id)
            .eq('unita_domustudio_id', u.domustudio_id)
            .limit(1)

          let proprietario = null
          if (propData?.length > 0) {
            const { data: anagData } = await supabase
              .from('anagrafiche')
              .select('*')
              .eq('archivio_id', u.archivio_id)
              .eq('domustudio_id', propData[0].anagrafica_domustudio_id)
              .limit(1)
            proprietario = anagData?.[0] || null
          }

          return { ...u, proprietario }
        })
      )

      setUnita(unitaConProprietari)
    } catch (err) {
      console.error('Errore dettaglio:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Tutti i condomini
        </button>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{edificio.intestazione}</h1>
            {edificio.indirizzo && (
              <p className="text-text-secondary text-sm mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {edificio.indirizzo}{edificio.citta ? `, ${edificio.citta}` : ''}
                {edificio.cap ? ` ${edificio.cap}` : ''}
              </p>
            )}
            {edificio.codice_fiscale && (
              <p className="text-text-muted text-xs mt-1">CF: {edificio.codice_fiscale}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-surface-card rounded-xl px-5 py-3 border border-border/50">
          <span className="text-lg font-bold text-text-primary">{unita.length}</span>
          <span className="text-xs text-text-muted ml-1.5">unità</span>
        </div>
        <div className="bg-surface-card rounded-xl px-5 py-3 border border-border/50">
          <span className="text-lg font-bold text-text-primary">{unita.filter(u => u.proprietario).length}</span>
          <span className="text-xs text-text-muted ml-1.5">condomini</span>
        </div>
      </div>

      {/* Lista condomini */}
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Condomini
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface-card rounded-xl border border-border/50 overflow-hidden">
          {unita.length === 0 ? (
            <p className="text-text-muted text-sm p-6 text-center">Nessuna unità trovata</p>
          ) : (
            <div className="divide-y divide-border/30">
              {unita.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-text-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {u.proprietario?.descrizione || 'Proprietario non trovato'}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {u.interno && (
                          <span className="text-xs text-text-muted">Int. {u.interno}</span>
                        )}
                        {u.piano && (
                          <span className="text-xs text-text-muted">Piano {u.piano}</span>
                        )}
                        {u.tipo && (
                          <span className="text-xs text-text-muted">{u.tipo}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {u.proprietario?.telefono1 && (
                      <a href={`tel:${u.proprietario.telefono1}`} className="text-text-muted hover:text-primary transition-colors" title={u.proprietario.telefono1}>
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {u.proprietario?.email && (
                      <a href={`mailto:${u.proprietario.email}`} className="text-text-muted hover:text-primary transition-colors" title={u.proprietario.email}>
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function CondominiPage() {
  const { studio } = useAuth()
  const [edifici, setEdifici] = useState([])
  const [selected, setSelected] = useState(null)
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

      const edificiConConteggi = await Promise.all(
        (data || []).map(async (ed) => {
          const [unitaRes, propRes] = await Promise.all([
            supabase.from('unita').select('id', { count: 'exact', head: true })
              .eq('archivio_id', ed.archivio_id).eq('edificio_domustudio_id', ed.domustudio_id),
            supabase.from('proprietari').select('id', { count: 'exact', head: true })
              .eq('archivio_id', ed.archivio_id),
          ])
          return { ...ed, unita_count: unitaRes.count || 0, proprietari_count: propRes.count || 0 }
        })
      )

      setEdifici(edificiConConteggi)
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
    <div className="p-6 lg:p-8 max-w-6xl">
      {selected ? (
        <CondominiDettaglio edificio={selected} onBack={() => setSelected(null)} />
      ) : (
        <CondominiList edifici={edifici} onSelect={setSelected} />
      )}
    </div>
  )
}
