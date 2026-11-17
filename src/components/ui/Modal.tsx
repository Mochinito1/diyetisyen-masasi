import type { ReactNode } from 'react'

export default function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/50 p-4 print:hidden" onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl border border-stone-200 bg-white p-5`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button className="ml-auto text-2xl leading-none text-stone-500" aria-label="Kapat" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}