import { useState } from 'react'
import { DEFAULT_BRAND, type Brand } from '../../lib/brand'
import { load, save } from '../../lib/storage'

const KEY = 'dm.brand'

export function useBrand() {
  const [brand, setBrand] = useState<Brand>(() => ({ ...DEFAULT_BRAND, ...load<Partial<Brand>>(KEY, {}) }))
  return {
    brand,
    update: (patch: Partial<Brand>) => {
      const next = { ...brand, ...patch }
      setBrand(next)
      save(KEY, next)
    },
  }
}