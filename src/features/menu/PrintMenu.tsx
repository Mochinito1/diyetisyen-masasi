import { createPortal } from 'react-dom'
import { fmtDay } from '../../lib/dossier'
import { firstName, fillTemplate, waHref, type Brand } from '../../lib/brand'
import { fmt, fmtMax } from '../../lib/format'
import { MEALS, portion, shortName, totals, type MenuItem } from '../../lib/menu'
import { todayStr } from '../../lib/appointments'
import type { FoodCtx } from '../../lib/useFoodData'
import type { Client } from '../clients/types'

const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-800 hover:bg-stone-100'

/**
 * Yazdırılabilir diyet listesi. "Yazdır" tarayıcının yazdırma penceresini açar; oradan "PDF olarak kaydet" seçilir.
 * Sayfa her zaman açık renkli basılır (koyu temadan etkilenmez).
 */
export default function PrintMenu({ client, menu, food, brand, target, onClose }: {
  client: Client
  menu: MenuItem[]
  food: FoodCtx
  brand: Brand
  target: number | null
  onClose: () => void
}) {
  const T = totals(menu, food.byCode, food.idx)
  const accent = brand.color || '#1f6b4f'
  const date = fmtDay(todayStr())
  const msg = fillTemplate(brand.tpl3, { ad: firstName(client.name), klinik: brand.clinic || brand.name })
  const wa = waHref(client.tel, msg)
  const th = { textAlign: 'left' as const, padding: '6px 8px', borderBottom: `2px solid ${accent}`, fontSize: 12 }
  const td = { padding: '6px 8px', borderBottom: '1px solid #ddd', fontSize: 13, verticalAlign: 'top' as const }
  const r = { textAlign: 'right' as const }

  return createPortal(
    <div className="print-overlay fixed inset-0 z-50 overflow-auto bg-black/60 p-4" onClick={onClose}>
      <div className="no-print mx-auto mb-3 flex max-w-[210mm] flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" onClick={() => window.print()}>Yazdır / PDF olarak kaydet</button>
        {wa ? <a className={btn} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp mesajı</a> : <button className={`${btn} opacity-50`} disabled title="Geçerli telefon yok">WhatsApp mesajı</button>}
        <button className={btn} onClick={() => navigator.clipboard?.writeText(msg)}>Mesajı kopyala</button>
        <button className={`${btn} ml-auto`} onClick={onClose}>Kapat</button>
      </div>
      <div className="mx-auto max-w-[210mm] rounded bg-white p-[12mm] shadow-lg" style={{ background: '#fff', color: '#111', fontFamily: 'Manrope, system-ui, sans-serif' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: `3px solid ${accent}`, paddingBottom: 10 }}>
          {brand.logo && <img src={brand.logo} alt="" style={{ maxHeight: 56, maxWidth: 140, objectFit: 'contain' }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: accent }}>{brand.clinic || brand.name || 'Beslenme programı'}</div>
            {brand.clinic && brand.name && <div style={{ fontSize: 13 }}>{brand.name}</div>}
            <div style={{ fontSize: 12, color: '#555' }}>{[brand.phone, brand.web, brand.addr].filter(Boolean).join(' · ')}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#555' }}>{date}</div>
        </div>

        <h1 style={{ fontSize: 22, margin: '14px 0 2px' }}>Kişisel beslenme programı</h1>
        <div style={{ fontSize: 14 }}>Danışan: <b>{client.name}</b></div>
        <div style={{ fontSize: 13, color: '#444', margin: '4px 0 12px' }}>
          Günlük toplam: <b>{fmt(T.kcal)} kcal</b>{target ? <> (hedef {fmt(target)} kcal)</> : null} · Protein {fmt(T.p)} g · Karbonhidrat {fmt(T.c)} g · Yağ {fmt(T.f)} g
        </div>

        {MEALS.map((m) => {
          const rows = menu.filter((it) => it.meal === m)
          if (!rows.length) return null
          const mt = totals(rows, food.byCode, food.idx)
          return (
            <table key={m} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, breakInside: 'avoid' }}>
              <thead>
                <tr><th style={th} colSpan={2}>{m}</th><th style={{ ...th, ...r }}>kcal</th><th style={{ ...th, ...r }}>P</th><th style={{ ...th, ...r }}>K</th><th style={{ ...th, ...r }}>Y</th></tr>
              </thead>
              <tbody>
                {rows.map((it, i) => {
                  const F = food.byCode.get(it.code)
                  if (!F) return null
                  const t = portion(F, it.g)
                  return (
                    <tr key={i}>
                      <td style={td}>{shortName(F.name)}</td>
                      <td style={td}>{it.u === 'g' ? `${fmt(it.g)} g` : `${fmtMax(it.q, 2)} ${it.u} (${fmt(it.g)} g)`}</td>
                      <td style={{ ...td, ...r }}>{fmt(t.kcal)}</td><td style={{ ...td, ...r }}>{fmt(t.p, 1)}</td><td style={{ ...td, ...r }}>{fmt(t.c, 1)}</td><td style={{ ...td, ...r }}>{fmt(t.f, 1)}</td>
                    </tr>
                  )
                })}
                <tr><td style={{ ...td, fontWeight: 700 }} colSpan={2}>Öğün toplamı</td><td style={{ ...td, ...r, fontWeight: 700 }}>{fmt(mt.kcal)}</td><td style={{ ...td, ...r }}>{fmt(mt.p, 1)}</td><td style={{ ...td, ...r }}>{fmt(mt.c, 1)}</td><td style={{ ...td, ...r }}>{fmt(mt.f, 1)}</td></tr>
              </tbody>
            </table>
          )
        })}

        {client.mnote.trim() && (
          <div style={{ border: `1px solid ${accent}`, borderRadius: 6, padding: 10, margin: '8px 0', fontSize: 13, whiteSpace: 'pre-wrap' }}>
            <b style={{ color: accent }}>Notlar</b>
            <div>{client.mnote}</div>
          </div>
        )}
        {brand.foot.trim() && <div style={{ marginTop: 12, fontSize: 13, whiteSpace: 'pre-wrap' }}>{brand.foot}</div>}
        <div style={{ marginTop: 14, fontSize: 10, color: '#777' }}>
          Ev ölçüleri yaklaşıktır; besin değerleri TürKomp (T.C. Tarım ve Orman Bakanlığı) verisine dayanır. Bu liste kişiye özel hazırlanmıştır, bilgilendirme amaçlıdır.
        </div>
      </div>
    </div>,
    document.body,
  )
}