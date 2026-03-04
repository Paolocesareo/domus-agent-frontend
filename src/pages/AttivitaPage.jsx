import { ClipboardList } from 'lucide-react'

export default function AttivitaPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Attività</h1>
        <p className="text-text-secondary text-sm mt-1">Gestisci le attività e le scadenze dei tuoi condomini</p>
      </div>

      <div className="bg-surface-card rounded-xl p-12 text-center border border-border/50">
        <ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary font-medium">In arrivo</p>
        <p className="text-text-muted text-sm mt-1">Questa sezione sarà disponibile a breve</p>
      </div>
    </div>
  )
}
