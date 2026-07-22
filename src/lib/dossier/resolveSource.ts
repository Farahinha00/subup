import type { DossierContext } from '@/types/dossier'

export function resolveSource(source: string, ctx: DossierContext): unknown {
  const [root, ...rest] = source.split('.')
  switch (root) {
    case 'profile':
      return get(ctx.profile, rest)
    case 'diagnostic':
      if (!ctx.diagnostic) return undefined
      return get(ctx.diagnostic as Record<string, unknown>, rest)
    case 'coffre_fort': {
      const [type, ...deeper] = rest
      const doc = ctx.coffre_fort[type]
      if (!doc) return undefined
      if (!deeper.length) return doc
      return get(doc as unknown as Record<string, unknown>, deeper)
    }
    case 'questions_specifiques':
      return get(ctx.questions_specifiques, rest)
    case 'dispositif':
      return get(ctx.dispositif, rest)
    default:
      return undefined
  }
}

function get(obj: Record<string, unknown>, path: string[]): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj
  for (const key of path) {
    if (cur == null) return undefined
    cur = cur[key]
  }
  return cur
}
