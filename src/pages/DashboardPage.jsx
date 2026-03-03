import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Building2, Users, Home, UserCheck, UserCog,
  RefreshCw, LogOut, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Database, FileText
} from 'lucide-react'

const STATUS_CONFIG = {
  completed: { label: 'Sincronizzato', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
  running: { label: 'In corso...', color: 'text-accent', bg: 'bg-accent/10', icon: RefreshCw },
  pending: { label: 'In attesa', color: 'text-text-muted', bg: 'bg-surface', icon: Clock },
  queued: { label: 'In coda', color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
  error: { label: 'Errore', color: 'text-error', bg: 'bg-error/10', icon: AlertTriangle },
}

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-surface-card rounded-xl p-4 shadow-sm border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color === 'text-primary' ? 'bg-primary/10' : 'bg-accent/10'} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

function ArchivioCard({ archivio, stats }) {
  const status = STATUS_CONFIG[archivio.sync_status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary text-lg">{archivio.nome_archivio}</h3>
          <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${archivio.sync_status === 'running' ? 'animate-spin' : ''}`} />
            {status.label}
          </div>
        </div>
        {archivio.last_sync_at && (
          <p className="text-xs text-text-muted">
            {new Date(archivio.last_sync_at).toLocaleDateString('it-IT', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-text-primary">{stats.edifici || 0}</p>
            <p className="text-xs text-text-muted">Edifici</p>
          </div>
          <div className="bg-surface rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-text-primary">{stats.unita || 0}</p>
            <p className="text-xs text-text-muted">Unità</p>
          </div>
          <div className="bg-surface rounded-lg p-2.5 text-center">
            <p className="text-lg font-bold text-text-primary">{stats.anagrafiche || 0}</p>
            <p className="text-xs text-text-muted">Anagrafiche</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user, studio, signOut } = useAuth()
  const [archivi, setArchivi] = useState([])
  const [stats, setStats] = useState({})
  const [totals, setTotals] = useState({ edifici: 0, unita: 0, anagrafiche: 0, proprietari: 0, movimenti: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studio) {
      loadData()
    }
  }, [studio])

  async function loadData() {
    setLoading(true)
    try {
      // Carica archivi
      const { data: archiviData } = await supabase
        .from('archivi')
        .select('*')
        .eq('studio_id', studio.studio_id)
        .order('nome_archivio')

      setArchivi(archiviData || [])

      // Carica stats per ogni archivio
      const statsMap = {}
      let totEdifici = 0, totUnita = 0, totAnag = 0, totProp = 0, totMov = 0

      for (const arch of (archiviData || [])) {
        const [edifici, unita, anagrafiche, proprietari, movimenti] = await Promise.all([
          supabase.from('edifici').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('unita').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('anagrafiche').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('proprietari').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('movimenti').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
        ])

        statsMap[arch.id] = {
          edifici: edifici.count || 0,
          unita: unita.count || 0,
          anagrafiche: anagrafiche.count || 0,
          proprietari: proprietari.count || 0,
          movimenti: movimenti.count || 0,
        }

        totEdifici += edifici.count || 0
        totUnita += unita.count || 0
        totAnag += anagrafiche.count || 0
        totProp += proprietari.count || 0
        totMov += movimenti.count || 0
      }

      setStats(statsMap)
      setTotals({ edifici: totEdifici, unita: totUnita, anagrafiche: totAnag, proprietari: totProp, movimenti: totMov })
    } catch (err) {
      console.error('Errore caricamento dati:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-primary shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">Domus Agent</h1>
              <p className="text-white/60 text-xs">{studio?.nome || 'Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
              title="Aggiorna dati"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={signOut}
              className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
              title="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats globali */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              <StatCard icon={Building2} label="Edifici" value={totals.edifici} />
              <StatCard icon={Home} label="Unità" value={totals.unita} />
              <StatCard icon={Users} label="Anagrafiche" value={totals.anagrafiche} color="text-accent" />
              <StatCard icon={UserCheck} label="Proprietari" value={totals.proprietari} />
              <StatCard icon={FileText} label="Movimenti" value={totals.movimenti.toLocaleString('it-IT')} color="text-accent" />
            </div>

            {/* Archivi */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                I tuoi archivi
              </h2>
              {archivi.length === 0 ? (
                <div className="bg-surface-card rounded-xl p-8 text-center border border-border/50">
                  <Database className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">Nessun archivio configurato</p>
                  <p className="text-text-muted text-sm mt-1">La prima sincronizzazione è in corso...</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {archivi.map((arch) => (
                    <ArchivioCard key={arch.id} archivio={arch} stats={stats[arch.id]} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
