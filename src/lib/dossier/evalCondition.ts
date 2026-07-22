import type { Condition, DossierContext } from '@/types/dossier'

export function evalCondition(cond: Condition | null, ctx: DossierContext): boolean {
  if (!cond) return true
  const val = resolveChamp(cond.champ, ctx)
  switch (cond.op) {
    case 'eq':       return val === cond.valeur
    case 'neq':      return val !== cond.valeur
    case 'gt':       return typeof val === 'number' && typeof cond.valeur === 'number' && val > cond.valeur
    case 'gte':      return typeof val === 'number' && typeof cond.valeur === 'number' && val >= cond.valeur
    case 'lt':       return typeof val === 'number' && typeof cond.valeur === 'number' && val < cond.valeur
    case 'lte':      return typeof val === 'number' && typeof cond.valeur === 'number' && val <= cond.valeur
    case 'in':       return Array.isArray(cond.valeur) && cond.valeur.includes(val)
    case 'null':     return val === null || val === undefined
    case 'not_null': return val !== null && val !== undefined
    default:         return true
  }
}

function resolveChamp(champ: string, ctx: DossierContext): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = ctx
  for (const part of champ.split('.')) {
    if (cur == null) return undefined
    cur = cur[part]
  }
  return cur
}
