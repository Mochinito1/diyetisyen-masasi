import { EMPTY_ANAMNESIS } from '../../lib/dossier'
import { EMPTY_PROFILE } from '../calculator/profile'
import type { Client } from './types'

/** Boş danışan kaydı */
export function makeClient(name = '', id: string = crypto.randomUUID()): Client {
  return {
    id, name, tel: '', email: '', profile: EMPTY_PROFILE, notes: '', menu: [], mnote: '', conds: [],
    kvkk: { ay: '', riza: '' }, trk: {}, an: { ...EMPTY_ANAMNESIS }, meas: [], lab: [], sess: [],
    created: Date.now(), updated: Date.now(),
  }
}