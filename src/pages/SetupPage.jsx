import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Building2, KeyRound, Plus, Trash2, AlertCircle } from 'lucide-react'

export default function SetupPage() {
  const { user, refreshStudio } = useAuth()
  const [studioName, setStudioName] = useState('')
  const [cid, setCid] = useState('')
  const [domUser, setDomUser] = useState('')
  const [domPassword, setDomPassword] = useState('')
  const [archivi, setArchivi] = useState([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addArchivio() {
    setArchivi([...archivi, ''])
  }

  function removeArchivio(index) {
    if (archivi.length === 1) return
    setArchivi(archivi.filter((_, i) => i !== index))
  }

  function updateArchivio(index, value) {
    const updated = [...archivi]
    updated[index] = value
    setArchivi(updated)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const validArchivi = archivi.filter(a => a.trim() !== '')
    if (validArchivi.length === 0) {
      setError('Inserisci almeno un archivio')
      setLoading(false)
      return
    }

    try {
      // Crea studio
      const studioId = studioName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      
      const { data: studioData, error: studioError } = await supabase
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

      // Crea archivi
      for (const nomeArchivio of validArchivi) {
        const { error: archError } = await supabase
          .from('archivi')
          .insert({
            studio_id: studioId,
            nome_archivio: nomeArchivio.trim(),
            sync_status: 'pending',
          })

        if (archError) throw archError
      }

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
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-accent" />
          </div>
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
                placeholder="Es. Studio Cesareo"
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
                  placeholder="Es. 2637"
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
                  placeholder="Es. admin"
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
                  placeholder="La password del tuo CloudConnector"
                />
              </div>
            </div>

            {/* Archivi */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-text-primary">
                  Archivi da sincronizzare
                </label>
                <button
                  type="button"
                  onClick={addArchivio}
                  className="text-sm text-primary hover:text-primary-light font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Aggiungi
                </button>
              </div>
              <p className="text-xs text-text-muted mb-3">
                Il nome deve corrispondere esattamente a quello che vedi nel CloudConnector
              </p>
              <div className="space-y-2">
                {archivi.map((archivio, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={archivio}
                      onChange={(e) => updateArchivio(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder={`Es. Studio Cesareo`}
                    />
                    {archivi.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArchivio(index)}
                        className="p-3 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info sicurezza */}
            <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary leading-relaxed">
                Le credenziali vengono criptate e utilizzate esclusivamente per scaricare
                i backup dal CloudConnector. Non accediamo mai al tuo gestionale in modo interattivo.
              </p>
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
                'Avvia sincronizzazione'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
