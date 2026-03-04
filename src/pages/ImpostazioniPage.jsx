import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  RefreshCw, Clock, CheckCircle2, AlertTriangle,
  Database, Building2, User
} from 'lucide-react'

const STATUS_CONFIG = {
  completed: { label: 'Sincronizzato', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
  running: { label: 'In corso...', color: 'text-accent', bg: 'bg-accent/10', icon: RefreshCw },
  pending: { label: 'In attesa', color: 'text-text-muted', bg: 'bg-surface', icon: Clock },
  queued: { label: 'In coda', color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
  error: { label: 'Errore', color: 'text-error', bg: 'bg-error/10', icon: AlertTriangle },
}

export default function ImpostazioniPage() {
  const { user, studio } = useAuth()
  const [archivi, setArchivi] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (studio) loadArchivi()
  }, [studio])

  async function loadArchivi() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('archivi')
        .select('*')
        .eq('studio_id', studio.studio_id)
        .order('nome_archivio')
      setArchivi(data || [])
    } catch (err) {
      console.error('Errore caricamento archivi:', err)
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
          if (!stillRunning) clearInterval(interval)
        }
      } catch (_) {}
    }, 5000)
  }

  // Parsing credenziali per mostrare CID
  let creds = {}
  try {
    creds = JSON.parse(studio?.domustudio_credentials_encrypted || '{}')
  } catch (_) {}

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Impostazioni</h1>
        <p className="text-text-secondary text-sm mt-1">Gestisci il tuo studio e la sincronizzazione dati</p>
      </div>

      {/* Info studio */}
      <div className="bg-surface-card rounded-xl p-6 border border-border/50 mb-6">
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

      {/* Sincronizzazione */}
      <div className="bg-surface-card rounded-xl p-6 border border-border/50">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Sincronizzazione
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : archivi.length === 0 ? (
          <p className="text-text-muted text-sm py-4">Nessun archivio configurato</p>
        ) : (
          <div className="space-y-3">
            {archivi.map((arch) => {
              const status = STATUS_CONFIG[arch.sync_status] || STATUS_CONFIG.pending
              const StatusIcon = status.icon
              return (
                <div key={arch.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{arch.nome_archivio}</p>
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
