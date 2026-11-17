export default function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-stone-600">{sub}</p>}
    </div>
  )
}