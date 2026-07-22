interface Props { etape: number; total: number }
const STEP_LABELS = ['Votre entreprise', 'Votre projet', 'Situation admin.']

export default function ProgressBar({ etape, total }: Props) {
  const pct = Math.round((etape / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-corail font-grotesk tracking-wide uppercase">
          Étape {etape} / {total} — {STEP_LABELS[etape - 1]}
        </span>
        <span className="text-xs text-ardoise-clair">{pct}%</span>
      </div>
      <div className="h-1.5 bg-pierre-clair rounded-full overflow-hidden">
        <div
          className="h-full bg-corail rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        {STEP_LABELS.map((l, i) => (
          <span
            key={l}
            className={`text-[11px] font-medium ${
              i + 1 < etape ? 'text-corail' : i + 1 === etape ? 'text-ardoise' : 'text-ardoise-clair opacity-50'
            }`}
          >
            {i + 1 < etape ? '✓ ' : ''}{l}
          </span>
        ))}
      </div>
    </div>
  )
}
