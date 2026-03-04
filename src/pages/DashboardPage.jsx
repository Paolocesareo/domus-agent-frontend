import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Wrench, Wallet, Building2, ArrowRight
} from 'lucide-react'

export default function DashboardPage() {
  const { studio } = useAuth()

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Situazione del tuo studio</p>
      </div>

      {/* Attività da monitorare */}
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Attività da monitorare
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Guasti e segnalazioni */}
        <div className="bg-surface-card rounded-xl p-6 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Guasti e segnalazioni</h3>
              <p className="text-text-muted text-sm mt-1">
                Attività aperte e in corso sui tuoi condomini
              </p>
              <p className="text-text-muted text-xs mt-3 italic">Disponibile a breve</p>
            </div>
          </div>
        </div>

        {/* Situazioni finanziarie */}
        <div className="bg-surface-card rounded-xl p-6 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Situazioni finanziarie</h3>
              <p className="text-text-muted text-sm mt-1">
                Economia delle risorse e fornitori in scadenza
              </p>
              <p className="text-text-muted text-xs mt-3 italic">Disponibile a breve</p>
            </div>
          </div>
        </div>
      </div>

      {/* Link rapidi */}
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Accesso rapido
      </h2>

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
              <p className="text-text-muted text-xs">I tuoi edifici gestiti</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/impostazioni"
          className="bg-surface-card rounded-xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Impostazioni</p>
              <p className="text-text-muted text-xs">Sincronizzazione e configurazione</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  )
}
