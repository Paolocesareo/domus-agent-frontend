import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import {
  Building2, Users, Home, UserCheck,
  FileText, ArrowRight, CheckCircle2, Clock
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-surface-card rounded-xl p-5 border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${accent ? 'bg-accent/10' : 'bg-primary/10'} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-accent' : 'text-primary'}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { studio } = useAuth()
  const [totals, setTotals] = useState({ edifici: 0, unita: 0, anagrafiche: 0, proprietari: 0, movimenti: 0 })
  const [archivi, setArchivi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studio) loadData()
  }, [studio])

  async function loadData() {
    setLoading(true)
    try {
      const { data: archiviData } = await supabase
        .from('archivi')
        .select('*')
        .eq('studio_id', studio.studio_id)
        .order('nome_archivio')

      setArchivi(archiviData || [])

      let totEdifici = 0, totUnita = 0, totAnag = 0, totProp = 0, totMov = 0

      for (const arch of (archiviData || [])) {
        const [edifici, unita, anagrafiche, proprietari, movimenti] = await Promise.all([
          supabase.from('edifici').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('unita').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('anagrafiche').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('proprietari').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('movimenti').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
        ])

        totEdifici += edifici.count || 0
        totUnita += unita.count || 0
        totAnag += anagrafiche.count || 0
        totProp += proprietari.count || 0
        totMov += movimenti.count || 0
      }

      setTotals({ edifici: totEdifici, unita: totUnita, anagrafiche: totAnag, proprietari: totProp, movimenti: totMov })
    } catch (err) {
      console.error('Errore caricamento dati:', err)
    } finally {
      setLoading(false)
    }
  }

  const lastSync = archivi.find(a => a.last_sync_at)
  const allSynced = archivi.length > 0 && archivi.every(a => a.sync_status === 'completed')

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Panoramica dei dati del tuo studio</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {lastSync && (
            <div className={`flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl text-sm ${
              allSynced ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'
            }`}>
              {allSynced ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span>
                {allSynced ? 'Dati aggiornati' : 'Sincronizzazione in corso'}
                {lastSync?.last_sync_at && (
                  <span className="text-text-muted ml-1">
                    · ultimo aggiornamento {new Date(lastSync.last_sync_at).toLocaleDateString('it-IT', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            <StatCard icon={Building2} label="Edifici" value={totals.edifici} />
            <StatCard icon={Home} label="Unità" value={totals.unita} />
            <StatCard icon={Users} label="Anagrafiche" value={totals.anagrafiche} accent />
            <StatCard icon={UserCheck} label="Proprietari" value={totals.proprietari} />
            <StatCard icon={FileText} label="Movimenti" value={totals.movimenti.toLocaleString('it-IT')} accent />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/condomini"
              className="bg-surface-card rounded-xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Condomini</p>
                  <p className="text-text-muted text-xs">{totals.edifici} edifici gestiti</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>

            <Link
              to="/impostazioni"
              className="bg-surface-card rounded-xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Impostazioni</p>
                  <p className="text-text-muted text-xs">Sincronizzazione e configurazione</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
