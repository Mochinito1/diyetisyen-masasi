import type { MenuItem } from '../../lib/menu'
import type { Profile } from '../calculator/profile'

export interface Client {
  id: string
  name: string
  tel: string
  email: string
  profile: Profile
  notes: string
  /** Danışanın menüsü ve danışana not */
  menu: MenuItem[]
  mnote: string
  created: number
  updated: number
}