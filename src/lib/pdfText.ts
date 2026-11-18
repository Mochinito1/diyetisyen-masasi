const MAX_BYTES = 10 * 1024 * 1024
const MAX_PAGES = 12

/** PDF'in metnini satır satır çıkarır. Dosya yalnızca tarayıcıda okunur, hiçbir yere gönderilmez. Kütüphane ilk kullanımda yüklenir. */
export async function pdfToLines(file: File): Promise<string[]> {
  if (file.size > MAX_BYTES) throw new Error('PDF çok büyük (en fazla 10 MB).')
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const lines: string[] = []
  const pages = Math.min(doc.numPages, MAX_PAGES)
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const rows: { y: number; parts: { x: number; s: string }[] }[] = []
    for (const it of content.items) {
      if (!('str' in it) || !it.str.trim()) continue
      const x = it.transform[4] as number
      const y = it.transform[5] as number
      const row = rows.find((r) => Math.abs(r.y - y) < 3)
      if (row) row.parts.push({ x, s: it.str })
      else rows.push({ y, parts: [{ x, s: it.str }] })
    }
    rows.sort((a, b) => b.y - a.y)
    for (const r of rows) lines.push(r.parts.sort((a, b) => a.x - b.x).map((q) => q.s.trim()).join('  '))
  }
  return lines
}
