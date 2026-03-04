import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Building2 } from 'lucide-react'

export default function SetupPage() {
  const { user, refreshStudio } = useAuth()
  const [studioName, setStudioName] = useState('')
  const [cid, setCid] = useState('')
  const [domUser, setDomUser] = useState('')
  const [domPassword, setDomPassword] = useState('')
  const [archivio, setArchivio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!archivio.trim()) {
      setError('Inserisci il nome del database')
      setLoading(false)
      return
    }

    try {
      const studioId = studioName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      
      const { error: studioError } = await supabase
        .from('studios')
        .insert({
          user_id: user.id,
          studio_id: studioId,
          nome: studioName,
          email: user.email,
          domustudio_credentials_encrypted: JSON.stringify({ cid, user: domUser, password: domPassword }),
        })
        .select()
        .single()

      if (studioError) throw studioError

      const { error: archError } = await supabase
        .from('archivi')
        .insert({
          studio_id: studioId,
          nome_archivio: archivio.trim(),
          sync_status: 'pending',
        })

      if (archError) throw archError

      await refreshStudio()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Errore durante la configurazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Domus Agent" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary">Configura il tuo studio</h1>
          <p className="text-text-secondary mt-1">
            Inserisci le credenziali Domustudio per avviare la sincronizzazione
          </p>
        </div>

        <div className="bg-surface-card rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome studio */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Nome dello studio
              </label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Il nome del tuo studio"
              />
            </div>

            {/* Credenziali Domustudio */}
            <div className="bg-surface rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-text-primary">Credenziali Domustudio</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">CID</label>
                <input
                  type="text"
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Il codice identificativo del tuo account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Utente Domustudio</label>
                <input
                  type="text"
                  value={domUser}
                  onChange={(e) => setDomUser(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Il tuo nome utente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Password Domustudio</label>
                <input
                  type="password"
                  value={domPassword}
                  onChange={(e) => setDomPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="La tua password di accesso"
                />
              </div>
            </div>

            {/* Database */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Nome del database
              </label>
              <input
                type="text"
                value={archivio}
                onChange={(e) => setArchivio(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Il nome esatto come appare su Domustudio"
              />
            </div>

            {error && (
              <div className="bg-error/10 text-error text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-light transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Salva configurazione'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
