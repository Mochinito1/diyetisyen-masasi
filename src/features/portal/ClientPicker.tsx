import { useAuth } from '../../app/auth'
import { field } from '../../components/ui/styles'
import type { Client } from '../clients/types'

export default function ClientPicker({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (id: string) => void }) {
  const { session } = useAuth()
  if (session?.kind !== 'admin') return null
  return (
    <label className="mb-4 block max-w-xs text-xs font-semibold text-stone-500">
      Test: hangi danışan olarak görüntüleniyor?
      <select className={`${field} mt-1 w-full`} value={value} onChange={(e) => onChange(e.target.value)}>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </label>
  )
}