import { useState } from 'react'
import { useAuth } from '../../app/auth'
import { DEFAULT_BRAND, type Brand } from '../../lib/brand'
import { brandKey, ownerOf } from '../../lib/dietitians'
import { load, save } from '../../lib/storage'

/** Klinik ayarları diyetisyene özeldir: diyetisyen kendisininkini, danışan seçtiği diyetisyeninkini görür. */
export function useBrand(ownerOverride?: string) {
  const { session } = useAuth()
  const owner = ownerOverride ?? ownerOf(session)
  const key = brandKey(owner)
  const [brand, setBrand] = useState<Brand>(() => ({ ...DEFAULT_BRAND, ...load<Partial<Brand>>(key, {}) }))
  return {
    brand,
    update: (patch: Partial<Brand>) => {
      const next = { ...brand, ...patch }
      setBrand(next)
      save(key, next)
    },
  }
}

/** Başka bir diyetisyenin klinik bilgisini okur (düzenlemeden) */
export const loadBrandOf = (owner: string): Brand => ({ ...DEFAULT_BRAND, ...load<Partial<Brand>>(brandKey(owner), {}) })