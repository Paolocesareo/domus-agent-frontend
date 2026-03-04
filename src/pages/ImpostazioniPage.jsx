import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  RefreshCw, Clock, CheckCircle2, AlertTriangle,
  Database, User, Building2, Home, Users, UserCheck, FileText
} from 'lucide-react'

const STATUS_CONFIG = {
  completed: { label: 'Sincronizzato', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
  running: { label: 'In corso...', color: 'text-accent', bg: 'bg-accent/10', icon: RefreshCw },
  pending: { label: 'In attesa', color: 'text-text-muted', bg: 'bg-surface', icon: Clock },
  queued: { label: 'In coda', color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
  error: { label: 'Errore', color: 'text-error', bg: 'bg-error/10', icon: AlertTriangle },
}

const TABS = [
  { id: 'profilo', label: 'Profilo' },
  { id: 'sync', label: 'Sincronizzazione' },
]

export default function ImpostazioniPage() {
  const { user, studio } = useAuth()
  const [tab, setTab] = useState('profilo')
  const [archivi, setArchivi] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (studio && tab === 'sync') loadSyncData()
  }, [studio, tab])

  async function loadSyncData() {
    setLoading(true)
    try {
      const { data: archiviData } = await supabase
        .from('archivi')
        .select('*')
        .eq('studio_id', studio.studio_id)
        .order('nome_archivio')

      setArchivi(archiviData || [])

      const statsMap = {}
      for (const arch of (archiviData || [])) {
        const [edifici, unita, anagrafiche, proprietari, conduttori, esercizi, movimenti, rate, rate_importi] = await Promise.all([
          supabase.from('edifici').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('unita').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('anagrafiche').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('proprietari').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('conduttori').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('esercizi').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('movimenti').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('rate').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
          supabase.from('rate_importi').select('id', { count: 'exact', head: true }).eq('archivio_id', arch.id),
        ])
        statsMap[arch.id] = {
          condomini: edifici.count || 0,
          unita: unita.count || 0,
          anagrafiche: anagrafiche.count || 0,
          proprietari: proprietari.count || 0,
          conduttori: conduttori.count || 0,
          esercizi: esercizi.count || 0,
          movimenti: movimenti.count || 0,
          rate: rate.count || 0,
          rate_importi: rate_importi.count || 0,
        }
      }
      setStats(statsMap)
    } catch (err) {
      console.error('Errore:', err)
    } finally {
      setLoading(false)
    }
  }

  async function triggerSync(archivioId) {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ archivio_id: archivioId }),
        }
      )
      if (response.ok) {
        setArchivi(prev => prev.map(a =>
          a.id === archivioId ? { ...a, sync_status: 'queued' } : a
        ))
        startPolling()
      }
    } catch (err) {
      console.error('Errore sync:', err)
    } finally {
      setSyncing(false)
    }
  }

  function startPolling() {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      if (attempts >= 60) { clearInterval(interval); return }
      try {
        const { data } = await supabase
          .from('archivi')
          .select('*')
          .eq('studio_id', studio.studio_id)
          .order('nome_archivio')
        if (data) {
          setArchivi(data)
          const stillRunning = data.some(a => a.sync_status === 'queued' || a.sync_status === 'running')
          if (!stillRunning) {
            clearInterval(interval)
            loadSyncData()
          }
        }
      } catch (_) {}
    }, 5000)
  }

  let creds = {}
  try { creds = JSON.parse(studio?.domustudio_credentials_encrypted || '{}') } catch (_) {}

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Impostazioni</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-card rounded-xl p-1 border border-border/50 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Profilo */}
      {tab === 'profilo' && (
        <div className="bg-surface-card rounded-xl p-6 border border-border/50">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Il tuo studio
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Nome</p>
              <p className="text-sm text-text-primary font-medium">{studio?.nome || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Email</p>
              <p className="text-sm text-text-primary">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">CID Domustudio</p>
              <p className="text-sm text-text-primary">{creds.cid || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Utente Domustudio</p>
              <p className="text-sm text-text-primary">{creds.user || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Sincronizzazione */}
      {tab === 'sync' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : archivi.map((arch) => {
            const status = STATUS_CONFIG[arch.sync_status] || STATUS_CONFIG.pending
            const StatusIcon = status.icon
            const s = stats[arch.id] || {}
            const totale = Object.values(s).reduce((a, b) => a + b, 0)

            return (
              <div key={arch.id} className="bg-surface-card rounded-xl border border-border/50 overflow-hidden">
                {/* Header archivio */}
                <div className="flex items-center justify-between p-5 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-text-primary">{arch.nome_archivio}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                          <StatusIcon className={`w-3 h-3 ${arch.sync_status === 'running' ? 'animate-spin' : ''}`} />
                          {status.label}
                        </div>
                        {arch.last_sync_at && (
                          <span className="text-xs text-text-muted">
                            · {new Date(arch.last_sync_at).toLocaleDateString('it-IT', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerSync(arch.id)}
                    disabled={syncing || arch.sync_status === 'running' || arch.sync_status === 'queued'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    Sincronizza
                  </button>
                </div>

                {/* Stats griglia */}
                {totale > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-px bg-border/30">
                    {[
                      { label: 'Condomini', value: s.condomini, icon: Building2 },
                      { label: 'Unità', value: s.unita, icon: Home },
                      { label: 'Anagrafiche', value: s.anagrafiche, icon: Users },
                      { label: 'Proprietari', value: s.proprietari, icon: UserCheck },
                      { label: 'Movimenti', value: s.movimenti, icon: FileText },
                      { label: 'Conduttori', value: s.conduttori },
                      { label: 'Esercizi', value: s.esercizi },
                      { label: 'Rate', value: s.rate },
                      { label: 'Importi rate', value: s.rate_importi },
                      { label: 'Totale', value: totale },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-card p-3 text-center">
                        <p className="text-lg font-bold text-text-primary">
                          {(item.value || 0).toLocaleString('it-IT')}
                        </p>
                        <p className="text-xs text-text-muted">{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
