import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Building2, MapPin, Users, Home } from 'lucide-react'

export default function CondominiPage() {
  const { studio } = useAuth()
  const [edifici, setEdifici] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studio) loadEdifici()
  }, [studio])

  async function loadEdifici() {
    setLoading(true)
    try {
      // Prendi gli archivi dello studio
      const { data: archivi } = await supabase
        .from('archivi')
        .select('id')
        .eq('studio_id', studio.studio_id)

      if (!archivi?.length) { setLoading(false); return }

      const archivioIds = archivi.map(a => a.id)

      // Prendi gli edifici
      const { data } = await supabase
        .from('edifici')
        .select('*')
        .in('archivio_id', archivioIds)
        .order('intestazione')

      // Per ogni edificio conta unità
      const edificiConConteggi = await Promise.all(
        (data || []).map(async (ed) => {
          const { count: unitaCount } = await supabase
            .from('unita')
            .select('id', { count: 'exact', head: true })
            .eq('archivio_id', ed.archivio_id)
            .eq('edificio_domustudio_id', ed.domustudio_id)
          return { ...ed, unita_count: unitaCount || 0 }
        })
      )

      setEdifici(edificiConConteggi)
    } catch (err) {
      console.error('Errore caricamento edifici:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Condomini</h1>
        <p className="text-text-secondary text-sm mt-1">Tutti gli edifici gestiti dal tuo studio</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : edifici.length === 0 ? (
        <div className="bg-surface-card rounded-xl p-12 text-center border border-border/50">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">Nessun condominio trovato</p>
          <p className="text-text-muted text-sm mt-1">Sincronizza i dati dalle Impostazioni</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {edifici.map((ed) => (
            <div key={ed.id} className="bg-surface-card rounded-xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary text-sm leading-tight truncate">
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
                {ed.codice_fiscale && (
                  <div className="text-text-muted text-xs truncate">
                    CF: {ed.codice_fiscale}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
